import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
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

interface CsvRow {
  [key: string]: string | undefined;
}

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
const API_TIMEOUT = 5000; // 5 secondi
const MAX_RETRIES = 2;
const MAX_CONCURRENT_REQUESTS = 15;
const GOOGLE_BOOKS_API_KEY = env.googleBooksApiKey;

// Cache in memoria per la sessione corrente
const coverCache = new Map<string, string | null>();

class BatchProcessor {
  private queue: (() => Promise<void>)[] = [];
  private processing = false;
  private maxConcurrent: number;

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
  }

  async add(fn: () => Promise<void>): Promise<void> {
    this.queue.push(fn);
    if (!this.processing) {
      this.processing = true;
      await this.process();
    }
  }

  private async process(): Promise<void> {
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.maxConcurrent);
      await Promise.all(batch.map(fn => fn()));
    }
    this.processing = false;
  }
}

const batchProcessor = new BatchProcessor(MAX_CONCURRENT_REQUESTS);

/**
 * Esegue una richiesta fetch con un timeout specificato
 * @param url - URL della richiesta
 * @param options - Opzioni della richiesta, incluso il timeout
 * @returns Promise<Response>
 */
async function fetchWithTimeout(
  url: string, 
  options: { timeout?: number } = {}
): Promise<Response> {
  const { timeout = API_TIMEOUT } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
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
 * Crea un delay promessa che si risolve dopo il tempo specificato
 * @param ms - Millisecondi da attendere
 * @returns Promise che si risolve dopo il delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetchWithTimeout(url, { timeout: API_TIMEOUT });
      if (response.ok) return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (i < retries - 1) await delay(Math.min(1000 * Math.pow(2, i), 3000)); // exponential backoff
    }
  }
  
  throw lastError || new Error('Failed after retries');
}

async function searchGoogleBooks(query: string): Promise<string | null> {
  if (!GOOGLE_BOOKS_API_KEY) return null;
  
  try {
    const response = await fetchWithRetry(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${GOOGLE_BOOKS_API_KEY}&fields=items(volumeInfo/imageLinks)&maxResults=1`
    );
    
    const data = await response.json();
    const imageLinks = data.items?.[0]?.volumeInfo?.imageLinks;
    
    // Preferisci immagini di qualità più alta quando disponibili
    return imageLinks?.thumbnail?.replace('zoom=1', 'zoom=2') || 
           imageLinks?.thumbnail ||
           null;
  } catch (error) {
    console.warn('Errore Google Books:', error);
    return null;
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

export async function getBookCoverUrlFromBook(
  book: { title: string; author?: string; isbn?: string },
  logger?: (message: string) => void
): Promise<string | null> {
  const { title, author, isbn } = book;
  
  const log = (message: string) => {
    console.log(message);
    logger?.(message);
  };

  // Controlla la cache
  const cacheKey = `${isbn || ''}-${title}-${author || ''}`;
  if (coverCache.has(cacheKey)) {
    const cachedUrl = coverCache.get(cacheKey);
    log(`📦 Copertina recuperata dalla cache per: "${title}"`);
    return cachedUrl;
  }

  return new Promise((resolve) => {
    batchProcessor.add(async () => {
      try {
        // 1. Prima prova con OpenLibrary ISBN
        if (isbn) {
          try {
            log(`🔍 Ricerca copertina su OpenLibrary per ISBN: ${isbn}`);
            const response = await fetchWithRetry(
              `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
            );
            const data = await response.json();
            const bookData = data[`ISBN:${isbn}`];
            if (bookData?.cover?.medium) {
              log(`✅ Copertina trovata su OpenLibrary per ISBN: ${isbn}`);
              coverCache.set(cacheKey, bookData.cover.medium);
              resolve(bookData.cover.medium);
              return;
            }
          } catch (error) {
            log(`⚠️ Errore OpenLibrary ISBN: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
          }
        }

        // 2. Prova con la ricerca per titolo su OpenLibrary
        try {
          const encodedTitle = encodeURIComponent(title);
          const encodedAuthor = author ? encodeURIComponent(author) : '';
          const query = `${encodedTitle}${encodedAuthor ? ` ${encodedAuthor}` : ''}`;
          
          log(`🔍 Ricerca su OpenLibrary per: "${query}"`);
          const response = await fetchWithRetry(
            `https://openlibrary.org/search.json?q=${query}&limit=1`
          );
          
          const data = await response.json();
          if (data.docs?.[0]?.cover_i) {
            const coverId = data.docs[0].cover_i;
            const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
            log(`✅ Copertina trovata su OpenLibrary per: "${title}"`);
            coverCache.set(cacheKey, coverUrl);
            resolve(coverUrl);
            return;
          }
        } catch (error) {
          log(`⚠️ Errore OpenLibrary ricerca: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
        }

        // 3. Prova con Google Books come ultima risorsa
        try {
          log(`🔍 Ricerca su Google Books per: "${title}"`);
          const query = encodeURIComponent(`${title}${author ? ` ${author}` : ''}${isbn ? ` isbn:${isbn}` : ''}`);
          const googleCover = await searchGoogleBooks(query);
          
          if (googleCover) {
            log(`✅ Copertina trovata su Google Books per: "${title}"`);
            coverCache.set(cacheKey, googleCover);
            resolve(googleCover);
            return;
          }
        } catch (error) {
          log(`⚠️ Errore Google Books: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
        }

        // Se tutto fallisce, restituisci null
        log(`❌ Nessuna copertina trovata per: "${title}"`);
        coverCache.set(cacheKey, null);
        resolve(null);
      } catch (error) {
        log(`❌ Errore generale: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
        coverCache.set(cacheKey, null);
        resolve(null);
      }
    });
  });
}

/**
 * Mappa i campi dal CSV al formato del database
 */
async function mapCsvToDbFields(row: CsvRow): Promise<any> {
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

        // createReadStream(filePath)
        //   .pipe(countParser)
        //   .on('data', () => {
        //     totalRows++;
        //   })
        //   .on('end', () => {
        //     addLog(`📊 Trovate ${totalRows} righe da importare`);

        // Dopo aver contato le righe, inizia l'importazione
        const parser = parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relaxColumnCount: true
        });

        // createReadStream(filePath)
        //   .pipe(parser)
        //   .on('data', (row: CsvRow) => {
        //     // Salta le righe vuote
        //     if (Object.values(row).every(value => !value)) {
        //       processedRows++;
        //       onProgress?.(processedRows, totalRows);
        //       return;
        //     }

        //     const operation = (async () => {
        //       try {
        //         const mappedData = await mapCsvToDbFields(row);
                
        //         // Cerca la copertina del libro
        //         mappedData.coverUrl = await getBookCoverUrlFromBook(mappedData, addLog);
                
        //         await prisma.book.create({
        //           data: mappedData
        //         });
        //         results.success++;
        //         addLog(`✅ Libro importato: "${mappedData.title}"`);
        //       } catch (error) {
        //         results.errors++;
        //         const errorMessage = `❌ Errore riga ${results.success + results.errors}: ${(error as Error).message}`;
        //         results.errorDetails.push(errorMessage);
        //         addLog(errorMessage);
        //       } finally {
        //         processedRows++;
        //         onProgress?.(processedRows, totalRows);
        //       }
        //     })();

        //     operations.push(operation);
        //   })
        //   .on('error', (error) => {
        //     addLog(`❌ Errore durante il parsing del CSV: ${error.message}`);
        //     reject(error);
        //   })
        //   .on('end', async () => {
        //     try {
        //       await Promise.all(operations);
        //       addLog(`\n📊 Riepilogo importazione:`);
        //       addLog(`✅ Libri importati con successo: ${results.success}`);
        //       if (results.errors > 0) {
        //         addLog(`❌ Errori: ${results.errors}`);
        //       }
        //       resolve(results);
        //     } catch (error) {
        //       addLog(`❌ Errore durante l'importazione: ${error}`);
        //       reject(error);
        //     }
        //   });
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
      // const writeStream = createWriteStream(filePath);
      
      const stringifier = stringify({
        header: true,
        columns: Object.entries(CSV_MAPPING).map(([header]) => header)
      });

      stringifier.on('error', (error) => {
        console.error('❌ Errore durante l\'esportazione:', error);
        reject(error);
      });

      for (const book of books) {
        const row: CsvRow = {};
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
      
      // writeStream.on('finish', () => {
      //   console.log(`✅ Esportazione completata con successo! ${books.length} libri esportati in ${filePath}`);
      //   resolve(books.length);
      // });

      // writeStream.on('error', (error) => {
      //   console.error('❌ Errore durante la scrittura del file:', error);
      //   reject(error);
      // });

      // stringifier.pipe(writeStream);
    } catch (error) {
      console.error('❌ Errore durante l\'esportazione:', error);
      reject(error);
    }
  });
}

/**
 * Funzione per gestire l'importazione CSV nel browser
 */
export async function parseCSVToBooks(
  csvContent: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ books: Book[]; errors: string[] }> {
  const CHUNK_SIZE = 100; // Numero di righe da processare per chunk
  const books: Book[] = [];
  const errors: string[] = [];
  
  return new Promise((resolve, reject) => {
    const parser = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let rowCount = 0;
    let totalRows = 0;
    let currentChunk: any[] = [];

    // Prima passiamo attraverso il file per contare le righe
    const lines = csvContent.split('\n').length - 1; // -1 per l'header
    totalRows = lines;

    parser.on('readable', async function() {
      let record;
      while ((record = parser.read()) !== null) {
        currentChunk.push(record);
        
        if (currentChunk.length >= CHUNK_SIZE) {
          await processChunk(currentChunk);
          currentChunk = [];
        }
      }
    });

    parser.on('end', async () => {
      // Processa l'ultimo chunk se presente
      if (currentChunk.length > 0) {
        await processChunk(currentChunk);
      }
      resolve({ books, errors });
    });

    parser.on('error', (err) => {
      errors.push(`Errore di parsing: ${err.message}`);
      reject({ books, errors });
    });

    async function processChunk(chunk: any[]) {
      const processedBooks = await Promise.all(
        chunk.map(async (row) => {
          try {
            const book = await mapCsvToDbFields(row);
            rowCount++;
            if (onProgress) {
              onProgress(rowCount, totalRows);
            }
            return book;
          } catch (error) {
            errors.push(`Riga ${rowCount + 1}: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
            return null;
          }
        })
      );

      books.push(...processedBooks.filter((book): book is Book => book !== null));
    }
  });
}

/**
 * Funzione per gestire l'esportazione CSV nel browser
 */
export async function convertBooksToCSV(books: any[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const reversedMapping: Record<string, string> = {};
    for (const [csvField, dbField] of Object.entries(CSV_MAPPING)) {
      reversedMapping[dbField] = csvField;
    }

    const chunks: string[] = [];
    const stringifier = stringify({
      header: true,
    });

    stringifier.on('readable', function() {
      let chunk;
      while ((chunk = stringifier.read()) !== null) {
        chunks.push(chunk);
      }
    });

    stringifier.on('error', function(err) {
      reject(err);
    });

    stringifier.on('finish', function() {
      resolve(chunks.join(''));
    });

    books.forEach(book => {
      const row: CsvRow = {};
      for (const [dbField, value] of Object.entries(book)) {
        if (reversedMapping[dbField]) {
          if (value instanceof Date) {
            row[reversedMapping[dbField]] = value.toISOString();
          } else {
            row[reversedMapping[dbField]] = String(value);
          }
        }
      }
      stringifier.write(row);
    });

    stringifier.end();
  });
}
