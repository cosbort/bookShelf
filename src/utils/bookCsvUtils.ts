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
  'Cover URL': 'coverUrl',
  'Cover Width': 'coverWidth',
  'Cover Height': 'coverHeight'
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

// Dimensioni standard delle copertine di OpenLibrary
const COVER_SIZES = {
  S: { width: 180, height: 270 },   // Small
  M: { width: 360, height: 540 },   // Medium
  L: { width: 720, height: 1080 },  // Large
} as const;

// Cache in memoria per la sessione corrente
const coverCache = new Map<string, { url: string | null; width?: number; height?: number }>();

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
      if (i < retries - 1) await delay(Math.min(1000 * Math.pow(2, i), 3000));
    }
  }
  
  throw lastError || new Error('Failed after retries');
}

async function searchGoogleBooks(query: string): Promise<{ url: string | null; width?: number; height?: number }> {
  if (!GOOGLE_BOOKS_API_KEY) return { url: null };
  
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetchWithRetry(
      `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&key=${GOOGLE_BOOKS_API_KEY}&fields=items(volumeInfo/imageLinks)&maxResults=1`
    );
    
    const data = await response.json();
    const imageLinks = data.items?.[0]?.volumeInfo?.imageLinks;
    
    if (imageLinks?.thumbnail) {
      // Google Books usa una dimensione standard di 128x192 per le thumbnail
      return {
        url: imageLinks.thumbnail.replace('zoom=1', 'zoom=2'),
        width: 128,
        height: 192
      };
    }
    
    return { url: null };
  } catch (error) {
    if (error instanceof Error) {
      console.warn('Errore Google Books:', error.message);
    }
    return { url: null };
  }
}

async function searchOpenLibrary(query: { title: string; author?: string; isbn?: string }): Promise<{ url: string | null; width?: number; height?: number }> {
  try {
    // Prima prova con l'ISBN se disponibile
    if (query.isbn) {
      const response = await fetchWithRetry(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${query.isbn}&format=json&jscmd=data`
      );
      const data = await response.json();
      const bookData = data[`ISBN:${query.isbn}`];
      if (bookData?.cover?.large) {
        return {
          url: bookData.cover.large,
          width: COVER_SIZES.L.width,
          height: COVER_SIZES.L.height
        };
      } else if (bookData?.cover?.medium) {
        return {
          url: bookData.cover.medium,
          width: COVER_SIZES.M.width,
          height: COVER_SIZES.M.height
        };
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
      return {
        url: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`,
        width: COVER_SIZES.L.width,
        height: COVER_SIZES.L.height
      };
    }

    return { url: null };
  } catch (error) {
    if (error instanceof Error) {
      console.warn('Errore OpenLibrary:', error.message);
    }
    return { url: null };
  }
}

async function getBookCoverUrl(isbn: string | null, title: string, author: string): Promise<{ url: string | null; width?: number; height?: number }> {
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
): Promise<{ url: string | null; width?: number; height?: number }> {
  try {
    // Prima prova con Google Books
    const googleCover = await getGoogleBooksCover(book);
    if (googleCover.url) return googleCover;

    // Se non trova nulla, prova con OpenLibrary
    const openLibraryCover = await getOpenLibraryCover(book);
    return openLibraryCover;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Errore nel recupero della copertina:', error.message);
    }
    return { url: null };
  }
}

async function getGoogleBooksCover(book: Partial<Book>): Promise<{ url: string | null; width?: number; height?: number }> {
  if (!book.title) return { url: null };

  const cacheKey = `google:${book.isbn || ''}:${book.title}`;
  if (coverCache.has(cacheKey)) {
    return coverCache.get(cacheKey)!;
  }

  let query = book.isbn ? `isbn:${book.isbn}` : book.title;
  if (!book.isbn && book.author) {
    query += ` inauthor:${book.author}`;
  }

  const result = await searchGoogleBooks(query);
  coverCache.set(cacheKey, result);
  return result;
}

async function getOpenLibraryCover(book: Partial<Book>): Promise<{ url: string | null; width?: number; height?: number }> {
  if (!book.title) return { url: null };

  const cacheKey = `openlib:${book.isbn || ''}:${book.title}`;
  if (coverCache.has(cacheKey)) {
    return coverCache.get(cacheKey)!;
  }

  const result = await searchOpenLibrary({
    title: book.title,
    author: book.author,
    isbn: book.isbn
  });

  coverCache.set(cacheKey, result);
  return result;
}

async function isImageAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(url, { timeout: 5000 });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

async function getCoverUrl(isbn: string | undefined, title: string, author: string, csvCoverUrl: string | undefined): Promise<{ url: string | undefined; width?: number; height?: number }> {
  // Se c'è un URL nella riga CSV e l'immagine è accessibile, usalo
  if (csvCoverUrl) {
    const isAccessible = await isImageAccessible(csvCoverUrl);
    if (isAccessible) {
      return { url: csvCoverUrl };
    }
  }

  // Altrimenti cerca la copertina usando le API
  const result = await getBookCoverUrl(isbn || null, title, author);
  return { 
    url: result.url || undefined,
    width: result.width,
    height: result.height
  };
}

async function processCsvRow(row: Record<string, string>): Promise<Partial<Book>> {
  const mappedData: Partial<Book> = {};

  for (const [csvKey, value] of Object.entries(row)) {
    const bookKey = CSV_MAPPING[csvKey as keyof typeof CSV_MAPPING];
    if (!bookKey || !value) continue;

    switch (bookKey) {
      case 'wishList':
      case 'previouslyOwned':
      case 'upNext':
        mappedData[bookKey] = stringToBoolean(value);
        break;
      case 'dateStarted':
      case 'dateFinished':
        mappedData[bookKey] = parseDate(value);
        break;
      case 'pageCount':
      case 'yearPublished':
      case 'currentPage':
      case 'coverWidth':
      case 'coverHeight':
        mappedData[bookKey] = parseNumber(value);
        break;
      case 'rating':
        mappedData[bookKey] = parseNumber(value);
        break;
      default:
        mappedData[bookKey as keyof Book] = value as any;
    }
  }

  // Cerca la copertina del libro
  const coverInfo = await getCoverUrl(
    mappedData.isbn,
    mappedData.title || '',
    mappedData.author || '',
    mappedData.coverUrl
  );

  if (coverInfo.url) {
    mappedData.coverUrl = coverInfo.url;
    mappedData.coverWidth = coverInfo.width;
    mappedData.coverHeight = coverInfo.height;
  }

  return mappedData;
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
              case 'coverWidth':
              case 'coverHeight':
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
