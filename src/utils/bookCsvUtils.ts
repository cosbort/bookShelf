import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { Book, ReadingStatus } from '@/types/book';
import { prisma } from '@/lib/prisma';
import { env, hasGoogleBooksApiKey } from '@/config/env';

const CSV_MAPPING = {
  'Title': 'title',
  'Original Title': 'originalTitle',
  'Subtitle': 'subtitle',
  'Author': 'author',
  'Author (Last, First)': 'authorLastFirst',
  'Translator': 'translator',
  'Publisher': 'publisher',
  'Date Published': 'publishedDate',
  'Year Published': 'yearPublished',
  'Genre': 'genre',
  'Summary': 'description',
  'Language': 'language',
  'Number of Pages': 'pageCount',
  'Rating': 'rating',
  'Physical Location': 'location',
  'Status': 'status',
  'Date Started': 'dateStarted',
  'Date Finished': 'dateFinished',
  'Current Page': 'currentPage',
  'Notes': 'notes',
  'Category': 'category',
  'Wish List': 'wishList',
  'Previously Owned': 'previouslyOwned',
  'Up Next': 'upNext',
  'ISBN': 'isbn',
  'Cover URL': 'coverUrl'
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
    const encodedQuery = encodeURIComponent(query);
    const response = await fetchWithRetry(
      `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&key=${GOOGLE_BOOKS_API_KEY}&fields=items(volumeInfo/imageLinks)&maxResults=1`
    );
    
    const data = await response.json();
    const imageLinks = data.items?.[0]?.volumeInfo?.imageLinks;
    
    // Preferisci immagini di qualità più alta quando disponibili
    return imageLinks?.thumbnail?.replace('zoom=1', 'zoom=2') || 
           imageLinks?.thumbnail ||
           null;
  } catch (error) {
    if (error instanceof Error) {
      console.warn('Errore Google Books:', error.message);
    }
    return null;
  }
}

async function searchOpenLibrary(query: { title: string; author?: string; isbn?: string }): Promise<string | null> {
  try {
    // Prima prova con l'ISBN se disponibile
    if (query.isbn) {
      const response = await fetchWithRetry(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${query.isbn}&format=json&jscmd=data`
      );
      const data = await response.json();
      const bookData = data[`ISBN:${query.isbn}`];
      if (bookData?.cover?.medium) {
        return bookData.cover.medium;
      }
    }

    // Se non trova con l'ISBN, prova con titolo e autore
    const searchQuery = encodeURIComponent(`${query.title}${query.author ? ` ${query.author}` : ''}`);
    const response = await fetchWithRetry(
      `https://openlibrary.org/search.json?q=${searchQuery}&limit=1`
    );
    
    const data = await response.json();
    if (data.docs?.[0]?.cover_i) {
      const coverId = data.docs[0].cover_i;
      return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
    }

    return null;
  } catch (error) {
    if (error instanceof Error) {
      console.warn('Errore OpenLibrary:', error.message);
    }
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
  book: Partial<Book>,
  logger?: (message: string) => void
): Promise<string | null> {
  try {
    // Prima prova con Google Books
    const googleCover = await getGoogleBooksCover(book);
    if (googleCover) return googleCover;

    // Se non trova nulla, prova con OpenLibrary
    const openLibraryCover = await getOpenLibraryCover(book);
    return openLibraryCover || null;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Errore nel recupero della copertina:', error.message);
    }
    return null;
  }
}

async function getGoogleBooksCover(book: Partial<Book>): Promise<string | null> {
  if (!hasGoogleBooksApiKey) return null;

  try {
    const query = book.isbn 
      ? `isbn:${book.isbn}`
      : `intitle:${book.title}${book.author ? ` inauthor:${book.author}` : ''}`;

    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}`
    );
    
    const data = await response.json();

    // Se abbiamo superato la quota, lanciamo un errore specifico
    if (data.error?.code === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    if (!data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
      return null;
    }

    // Converti l'URL da http a https se necessario
    const coverUrl = data.items[0].volumeInfo.imageLinks.thumbnail.replace('http://', 'https://');
    return coverUrl;
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
      console.warn('Google Books API quota exceeded, falling back to OpenLibrary');
      return getOpenLibraryCover(book);
    }
    console.error('Error fetching Google Books cover:', error);
    return null;
  }
}

async function getOpenLibraryCover(book: Partial<Book>): Promise<string | null> {
  try {
    // Prima prova con l'ISBN se disponibile
    if (book.isbn) {
      const response = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${book.isbn}&format=json&jscmd=data`
      );
      const data = await response.json();
      const bookData = data[`ISBN:${book.isbn}`];
      if (bookData?.cover?.medium) {
        return bookData.cover.medium;
      }
    }

    // Se non trova con l'ISBN, prova con titolo e autore
    const searchQuery = encodeURIComponent(`${book.title}${book.author ? ` ${book.author}` : ''}`);
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${searchQuery}&limit=1`
    );
    
    const data = await response.json();
    if (data.docs?.[0]?.cover_i) {
      const coverId = data.docs[0].cover_i;
      return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
    }

    return null;
  } catch (error) {
    if (error instanceof Error) {
      console.error('OpenLibrary API error:', error.message);
    }
    return null;
  }
}

/**
 * Verifica se l'immagine è accessibile
 */
async function isImageAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(url, { timeout: 5000 });
    const contentType = response.headers.get('content-type');
    return response.ok && Boolean(contentType?.startsWith('image/'));
  } catch (error) {
    console.error('Error checking image accessibility:', error);
    return false;
  }
}

async function getCoverUrl(isbn: string | undefined, title: string, author: string, csvCoverUrl: string | undefined): Promise<string | undefined> {
  // Se c'è un URL nel CSV e sembra valido, verifica che l'immagine sia accessibile
  if (csvCoverUrl?.trim() && (csvCoverUrl.startsWith('http://') || csvCoverUrl.startsWith('https://'))) {
    const url = csvCoverUrl.trim();
    if (await isImageAccessible(url)) {
      return url;
    }
    console.warn(`Image not accessible at ${url}, falling back to OpenLibrary`);
  }

  // Altrimenti cerca su OpenLibrary
  if (!isbn && !title) return undefined;

  try {
    let query = isbn ? `isbn:${isbn}` : `title:${title}${author ? ` author:${author}` : ''}`;
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=cover_i`);
    const data = await response.json();

    if (data.docs && data.docs[0] && data.docs[0].cover_i) {
      const openLibraryUrl = `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
      if (await isImageAccessible(openLibraryUrl)) {
        return openLibraryUrl;
      }
      console.warn(`Image not accessible at ${openLibraryUrl}`);
    }
  } catch (error) {
    console.error('Error fetching cover:', error);
  }
  return undefined;
}

async function processCsvRow(row: Record<string, string>): Promise<Partial<Book>> {
  const isbn = row['ISBN']?.trim();
  const title = row['Title']?.trim() || '';
  const author = row['Author']?.trim() || '';
  const csvCoverUrl = row['Cover URL']?.trim();
  
  const coverUrl = await getCoverUrl(isbn, title, author, csvCoverUrl);

  return {
    id: crypto.randomUUID(),
    title,
    originalTitle: row['Original Title']?.trim(),
    subtitle: row['Subtitle']?.trim(),
    author,
    authorLastFirst: row['Author (Last, First)']?.trim(),
    translator: row['Translator']?.trim(),
    publisher: row['Publisher']?.trim(),
    publishedDate: row['Date Published']?.trim(),
    yearPublished: row['Year Published'] ? parseInt(row['Year Published'].trim(), 10) : undefined,
    genre: row['Genre']?.trim(),
    description: row['Summary']?.trim(),
    language: row['Language']?.trim() || 'Italiano',
    pageCount: row['Number of Pages'] ? parseInt(row['Number of Pages'].trim(), 10) : undefined,
    rating: row['Rating'] ? parseFloat(row['Rating'].trim()) : undefined,
    location: row['Physical Location']?.trim(),
    status: (row['Status']?.trim() as ReadingStatus) || 'To Read',
    dateStarted: row['Date Started'] ? new Date(row['Date Started'].trim()) : undefined,
    dateFinished: row['Date Finished'] ? new Date(row['Date Finished'].trim()) : undefined,
    currentPage: row['Current Page'] ? parseInt(row['Current Page'].trim(), 10) : undefined,
    notes: row['Notes']?.trim(),
    category: row['Category']?.trim(),
    wishList: stringToBoolean(row['Wish List']?.trim()),
    previouslyOwned: stringToBoolean(row['Previously Owned']?.trim()),
    upNext: stringToBoolean(row['Up Next']?.trim()),
    isbn,
    coverUrl,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Importa libri da un file CSV nel database
 */
export async function importBooksFromCsv(
  filePath: string,
  writer: WritableStreamDefaultWriter<Uint8Array>
): Promise<{
  success: number;
  errors: number;
  errorDetails: string[];
  logs: string[];
}> {
  return new Promise(async (resolve, reject) => {
    const results: {
      success: number;
      errors: number;
      errorDetails: string[];
      logs: string[];
    } = { 
      success: 0, 
      errors: 0, 
      errorDetails: [], 
      logs: [] 
    };
    const operations: Promise<void>[] = [];
    let totalRows = 0;
    let processedRows = 0;
    let lastProgressUpdate = 0;

    const addLog = (message: string) => {
      results.logs.push(message);
    };

    const updateProgress = async () => {
      processedRows++;
      const progress = Math.min(Math.round((processedRows / totalRows) * 100), 100);
      
      // Invia aggiornamenti solo se la percentuale è cambiata e non supera il 100%
      if (progress > lastProgressUpdate && progress <= 100) {
        try {
          const progressMessage = JSON.stringify({ progress }) + "\n";
          const encoder = new TextEncoder();
          const data = encoder.encode(progressMessage);
          await writer.write(data);
          lastProgressUpdate = progress;
        } catch (error) {
          if (error instanceof TypeError && String(error).includes('ERR_INVALID_STATE')) {
            // Ignora gli errori di stream chiuso
            console.warn('Stream chiuso, impossibile inviare aggiornamenti');
          } else {
            console.error('Errore nell\'invio del progresso:', error);
          }
        }
      }
    };

    addLog(`\n📋 Inizio importazione CSV...`);

    // Prima conta il numero totale di righe
    const countStream = require('fs').createReadStream(filePath);
    const countParser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relaxColumnCount: true
    });

    // Utilizza una Promise per contare le righe
    await new Promise((resolveCount) => {
      countStream
        .pipe(countParser)
        .on('data', () => {
          totalRows++;
        })
        .on('end', () => {
          addLog(`📊 Trovate ${totalRows} righe da importare`);
          resolveCount(true);
        });
    });

    // Ora inizia l'importazione effettiva
    const importStream = require('fs').createReadStream(filePath);
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relaxColumnCount: true
    });

    let isStreamActive = true;

    importStream
      .pipe(parser)
      .on('data', async (row: CsvRow) => {
        // Salta le righe vuote
        if (Object.values(row).every(value => !value)) {
          await updateProgress();
          return;
        }

        const operation = processRow(row).then(async () => {
          if (isStreamActive) {
            await updateProgress();
          }
        });
        operations.push(operation);
      })
      .on('end', async () => {
        try {
          await Promise.all(operations);
          isStreamActive = false;
          
          // Assicurati che il progresso finale sia 100%
          if (lastProgressUpdate < 100) {
            try {
              const progressMessage = JSON.stringify({ progress: 100 }) + "\n";
              const encoder = new TextEncoder();
              const data = encoder.encode(progressMessage);
              await writer.write(data);
            } catch (error) {
              console.warn('Errore nell\'invio del progresso finale:', error);
            }
          }

          try {
            const resultMessage = JSON.stringify({
              success: results.success,
              errors: results.errors,
              errorDetails: results.errorDetails
            }) + "\n";
            const encoder = new TextEncoder();
            const data = encoder.encode(resultMessage);
            await writer.write(data);
          } catch (error) {
            console.warn('Errore nell\'invio del risultato finale:', error);
          }

          addLog(`\n✨ Importazione completata: ${results.success} libri importati/aggiornati, ${results.errors} errori`);
          resolve(results);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error: Error) => {
        isStreamActive = false;
        reject(error);
      });

    const processRow = async (row: CsvRow) => {
      try {
        // Convertiamo CsvRow in Record<string, string> gestendo i valori undefined
        const sanitizedRow: Record<string, string> = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key, value ?? ''])
        );
        const mappedData = await processCsvRow(sanitizedRow);
        
        // Cerca se esiste già un libro con lo stesso ISBN o titolo+autore
        const existingBook = await prisma.book.findFirst({
          where: {
            OR: [
              { isbn: mappedData.isbn },
              {
                AND: [
                  { title: mappedData.title },
                  { author: mappedData.author }
                ]
              }
            ]
          }
        });

        if (existingBook) {
          // Aggiorna il libro esistente
          await prisma.book.update({
            where: { id: existingBook.id },
            data: mappedData
          });
          addLog(`🔄 Libro aggiornato: "${mappedData.title}"`);
        } else {
          // Crea un nuovo libro
          await prisma.book.create({
            data: mappedData as any
          });
          addLog(`✨ Nuovo libro aggiunto: "${mappedData.title}"`);
        }
        results.success++;
      } catch (error) {
        results.errors++;
        const errorMessage = `❌ Errore nell'importazione della riga: ${JSON.stringify(row)}\n${error}`;
        results.errorDetails.push(errorMessage);
        addLog(errorMessage);
      }
    };
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
      const writeStream = require('fs').createWriteStream(filePath);
      
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
      
      writeStream.on('finish', () => {
        console.log(`✅ Esportazione completata con successo! ${books.length} libri esportati in ${filePath}`);
        resolve(books.length);
      });

      writeStream.on('error', (error: Error) => {
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

/**
 * Funzione per gestire l'importazione CSV nel browser
 */
export async function parseCSVToBooks(
  csvContent: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ books: Partial<Book>[]; errors: string[] }> {
  const CHUNK_SIZE = 100; // Numero di righe da processare per chunk
  const books: Partial<Book>[] = [];
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
            const book = await processCsvRow(row);
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

      books.push(...processedBooks.filter((book): book is Partial<Book> => book !== null));
    }
  });
}

/*
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
