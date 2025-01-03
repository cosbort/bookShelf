import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { createReadStream, createWriteStream } from 'fs';
import { Book } from '@/types/book';
import { prisma } from '@/lib/prisma';
import { env, hasGoogleBooksApiKey } from '@/config/env';

const CSV_MAPPING = {
  'Title': 'title',
  'Author': 'author',
  'Status': 'status',
  'Original Title': 'originalTitle',
  'Subtitle': 'subtitle',
  'Author (Last, First)': 'authorLastFirst',
  'Translator': 'translator',
  'Publisher': 'publisher',
  'Genre': 'genre',
  'Summary': 'description',
  'Year Published': 'yearPublished',
  'Language': 'language',
  'Number of Pages': 'pageCount',
  'Rating': 'rating',
  'Physical Location': 'location',
  'Date Started': 'dateStarted',
  'Date Finished': 'dateFinished',
  'Current Page': 'currentPage',
  'Notes': 'notes',
  'Category': 'category',
  'Wish List': 'wishList',
  'Previously Owned': 'previouslyOwned',
  'Up Next': 'upNext',
  'ISBN': 'isbn'
};

// Funzioni di utilità per la conversione dei dati
function stringToBoolean(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalizedValue = value.toLowerCase().trim();
  return ['true', 'yes', 'y', '1', 'si', 'sì'].includes(normalizedValue);
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function parseNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

// Costanti per la gestione delle richieste API
const API_TIMEOUT = 10000; // 10 secondi
const API_DELAY = 1000; // 1 secondo tra le richieste
const MAX_RETRIES = 3;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Ottiene l'URL della copertina del libro usando l'API di Google Books
 */
async function getBookCoverUrl(isbn: string | null, title: string, author: string): Promise<string | null> {
  const book = { 
    title, 
    author: author || undefined,
    isbn: isbn || undefined 
  };
  return getBookCoverUrlFromBook(book);
}

async function getBookCoverUrlFromBook(
  book: { title: string; author?: string; isbn?: string },
  logger?: (message: string) => void
): Promise<string | null> {
  const { title, author, isbn } = book;
  let query = '';
  
  const log = (message: string) => {
    console.log(message);
    logger?.(message);
  };

  if (!hasGoogleBooksApiKey()) {
    log('⚠️ Chiave API di Google Books non configurata');
    return null;
  }

  log(`ℹ️ Usando la chiave API: ${env.googleBooksApiKey.substring(0, 8)}...`);
  
  if (isbn) {
    query = `isbn:${isbn}`;
  } else {
    const encodedTitle = encodeURIComponent(title);
    const encodedAuthor = author ? encodeURIComponent(author) : '';
    query = `intitle:${encodedTitle}${encodedAuthor ? `+inauthor:${encodedAuthor}` : ''}`;
  }

  const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&key=${env.googleBooksApiKey}`;
  log(`[${new Date().toISOString()}] 📚 Ricerca libro: "${title}"${author ? ` di "${author}"` : ''}${isbn ? ` (ISBN: ${isbn})` : ''}`);
  log(`🔍 Query: ${query}`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 1) {
        log(`🔄 Tentativo ${attempt}/${MAX_RETRIES} per "${title}"`);
        await delay(API_DELAY * attempt);
      }

      const response = await fetchWithTimeout(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
        const coverUrl = data.items[0].volumeInfo.imageLinks.thumbnail;
        log(`✅ Copertina trovata per "${title}"`);
        return coverUrl;
      }
      
      log(`❌ Nessuna copertina trovata per "${title}"`);
      return null;
    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES;
      log(`❌ ${isLastAttempt ? 'Errore finale' : `Errore (tentativo ${attempt}/${MAX_RETRIES})`} per "${title}": ${error}`);
      
      if (isLastAttempt) {
        return null;
      }
      
      await delay(API_DELAY * attempt);
    }
  }

  return null;
}

/**
 * Mappa i campi dal CSV al formato del database
 */
async function mapCsvToDbFields(row: any): Promise<any> {
  const mapped: any = {};

  // Mappa i campi dal CSV al database
  for (const [csvField, dbField] of Object.entries(CSV_MAPPING)) {
    mapped[dbField] = row[csvField] ?? undefined;
  }

  // Converti i campi booleani
  mapped.wishList = stringToBoolean(mapped.wishList);
  mapped.previouslyOwned = stringToBoolean(mapped.previouslyOwned);
  mapped.upNext = stringToBoolean(mapped.upNext);

  // Converti le date
  mapped.dateStarted = parseDate(mapped.dateStarted);
  mapped.dateFinished = parseDate(mapped.dateFinished);

  // Converti i numeri
  mapped.pageCount = parseNumber(mapped.pageCount);
  mapped.currentPage = parseNumber(mapped.currentPage);
  mapped.rating = parseNumber(mapped.rating) || 0;
  mapped.yearPublished = parseNumber(mapped.yearPublished);

  // Imposta valori predefiniti per campi obbligatori
  mapped.title = mapped.title || 'Senza titolo';
  mapped.author = mapped.author || 'Autore sconosciuto';
  mapped.status = mapped.status || 'Unread';
  mapped.language = mapped.language || 'Italiano';

  return mapped;
}

/**
 * Importa libri da un file CSV nel database
 */
export async function importBooksFromCsv(
  filePath: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ 
  success: number; 
  errors: number; 
  errorDetails: string[];
  logs: string[];
}> {
  return new Promise((resolve, reject) => {
    const results = { 
      success: 0, 
      errors: 0, 
      errorDetails: [] as string[],
      logs: [] as string[]
    };

    const operations: Promise<void>[] = [];
    let totalRows = 0;
    let processedRows = 0;

    const addLog = (message: string) => {
      console.log(message);
      results.logs.push(message);
    };

    // Prima conta il numero totale di righe
    const countParser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relaxColumnCount: true
    });

    addLog(`\n📋 Inizio importazione CSV...`);

    // Cancella tutti i libri esistenti
    prisma.book.deleteMany()
      .then(() => {
        addLog(`🗑️ Database svuotato con successo`);

        createReadStream(filePath)
          .pipe(countParser)
          .on('data', () => {
            totalRows++;
          })
          .on('end', () => {
            addLog(`📊 Trovate ${totalRows} righe da importare`);

            // Dopo aver contato le righe, inizia l'importazione
            const parser = parse({
              columns: true,
              skip_empty_lines: true,
              trim: true,
              relaxColumnCount: true
            });

            createReadStream(filePath)
              .pipe(parser)
              .on('data', (row) => {
                // Salta le righe vuote
                if (Object.values(row).every(value => !value)) {
                  processedRows++;
                  onProgress?.(processedRows, totalRows);
                  return;
                }

                const operation = (async () => {
                  try {
                    const mappedData = await mapCsvToDbFields(row);
                    
                    // Cerca la copertina del libro
                    mappedData.coverUrl = await getBookCoverUrlFromBook(mappedData, addLog);
                    
                    await prisma.book.create({
                      data: mappedData
                    });
                    results.success++;
                    addLog(`✅ Libro importato: "${mappedData.title}"`);
                  } catch (error) {
                    results.errors++;
                    const errorMessage = `❌ Errore riga ${results.success + results.errors}: ${(error as Error).message}`;
                    results.errorDetails.push(errorMessage);
                    addLog(errorMessage);
                  } finally {
                    processedRows++;
                    onProgress?.(processedRows, totalRows);
                  }
                })();

                operations.push(operation);
              })
              .on('error', (error) => {
                addLog(`❌ Errore durante il parsing del CSV: ${error.message}`);
                reject(error);
              })
              .on('end', async () => {
                try {
                  await Promise.all(operations);
                  addLog(`\n📊 Riepilogo importazione:`);
                  addLog(`✅ Libri importati con successo: ${results.success}`);
                  if (results.errors > 0) {
                    addLog(`❌ Errori: ${results.errors}`);
                  }
                  resolve(results);
                } catch (error) {
                  addLog(`❌ Errore durante l'importazione: ${error}`);
                  reject(error);
                }
              });
          });
      });
  });
}

/**
 * Esporta libri dal database in un file CSV
 */
export async function exportBooksToCsv(
  filePath: string,
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  return new Promise(async (resolve, reject) => {
    try {
      // Conta il numero totale di libri
      const totalBooks = await prisma.book.count();
      let exportedBooks = 0;

      console.log(`📋 Inizio esportazione di ${totalBooks} libri...`);

      const books = await prisma.book.findMany();
      const writeStream = createWriteStream(filePath);
      
      const stringifier = stringify({
        header: true,
        columns: Object.entries(CSV_MAPPING).map(([header]) => header)
      });

      stringifier.on('error', (error) => {
        console.error('❌ Errore durante l\'esportazione:', error);
        reject(error);
      });

      for (const book of books) {
        const row: any = {};
        for (const [csvField, dbField] of Object.entries(CSV_MAPPING)) {
          const value = (book as any)[dbField];
          if (value !== undefined && value !== null) {
            switch(dbField) {
              case 'dateStarted':
              case 'dateFinished':
              case 'createdAt':
              case 'updatedAt':
                row[csvField] = value ? new Date(value).toISOString().split('T')[0] : '';
                break;
              case 'wishList':
              case 'previouslyOwned':
              case 'upNext':
                row[csvField] = value ? 'Yes' : 'No';
                break;
              case 'pageCount':
              case 'currentPage':
              case 'rating':
              case 'yearPublished':
                row[csvField] = value.toString();
                break;
              default:
                row[csvField] = value.toString();
            }
          } else {
            row[csvField] = '';
          }
        }
        
        stringifier.write(row);
        exportedBooks++;
        if (exportedBooks % 10 === 0 || exportedBooks === totalBooks) {
          console.log(`📊 Esportati ${exportedBooks}/${totalBooks} libri (${Math.round((exportedBooks/totalBooks)*100)}%)`);
        }
        onProgress?.(exportedBooks, totalBooks);
      }

      stringifier.end();
      
      writeStream.on('finish', () => {
        console.log(`✅ Esportazione completata con successo! ${books.length} libri esportati in ${filePath}`);
        resolve(books.length);
      });

      writeStream.on('error', (error) => {
        console.error('❌ Errore durante la scrittura del file:', error);
        reject(error);
      });

      stringifier.pipe(writeStream);
    } catch (error) {
      console.error('❌ Errore durante l\'esportazione:', error);
      reject(error);
    }
  });
}
