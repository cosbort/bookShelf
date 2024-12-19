import { useOpenLibrarySearch } from './useOpenLibrarySearch';
import { useState, useRef } from 'react';
import type { Book, SearchBookResult } from '@/types/book';

interface GoogleBookResponse {
  items: Array<{
    id: string;
    volumeInfo: {
      title: string;
      authors?: string[];
      categories?: string[];
      imageLinks?: {
        thumbnail: string;
      };
      description?: string;
      publishedDate?: string;
      publisher?: string;
      pageCount?: number;
      industryIdentifiers?: Array<{
        type: string;
        identifier: string;
      }>;
    };
  }>;
}

export function useBookSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRequestTime = useRef<number>(0);
  const requestCache = useRef<Map<string, any>>(new Map());
  const abortController = useRef<AbortController | null>(null);
  const quotaExceeded = useRef<boolean>(false);
  const MIN_REQUEST_INTERVAL = 3000;
  const MAX_RETRIES = 2;
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // Cache estesa a 24 ore
  const openLibrarySearchInstance = useOpenLibrarySearch();

  const cleanupCache = () => {
    const now = Date.now();
    for (const [key, value] of requestCache.current.entries()) {
      if (value.timestamp && now - value.timestamp > CACHE_DURATION) {
        requestCache.current.delete(key);
      }
    }
  };

  const waitForRateLimit = async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => 
        setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }
    lastRequestTime.current = Date.now();
  };

  const makeRequest = async (url: string, retryCount = 0): Promise<any> => {
    // Se la quota è stata superata, usa solo la cache
    if (quotaExceeded.current) {
      const cachedData = requestCache.current.get(url);
      if (cachedData?.data) {
        return cachedData.data;
      }
      throw new Error('Limite giornaliero delle ricerche raggiunto. Riprova domani.');
    }

    cleanupCache();

    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    const cachedData = requestCache.current.get(url);
    if (cachedData?.data && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return cachedData.data;
    }

    await waitForRateLimit();
    
    try {
      const response = await fetch(url, {
        signal: abortController.current.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();

      // Controlla se abbiamo superato la quota
      if (data.error?.message?.includes('RATE_LIMIT_EXCEEDED') || 
          data.error?.message?.includes('Quota exceeded')) {
        quotaExceeded.current = true;
        throw new Error('Limite giornaliero delle ricerche raggiunto. Riprova domani.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      requestCache.current.set(url, {
        data,
        timestamp: Date.now()
      });
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request cancelled');
        }
        if (error.message.includes('Limite giornaliero')) {
          throw error;
        }
      }
      
      if (retryCount < MAX_RETRIES) {
        const waitTime = Math.pow(2, retryCount + 1) * 1500;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return makeRequest(url, retryCount + 1);
      }
      throw error;
    }
  };

  const searchByIsbn = async (isbn: string): Promise<Partial<Book> | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prima prova con Google Books
      try {
        const data: GoogleBookResponse = await makeRequest(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY}`
        );

        if (data.items?.[0]) {
          return transformGoogleBookToBook(data.items[0]);
        }
      } catch (err) {
        console.log('Google Books API fallita, provo con Open Library');
      }

      // Fallback a Open Library
      const openLibraryResponse = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
      const openLibraryData = await openLibraryResponse.json();
      
      const bookData = openLibraryData[`ISBN:${isbn}`];
      if (!bookData) {
        setError('Nessun libro trovato con questo ISBN');
        return null;
      }

      return {
        title: bookData.title,
        author: bookData.authors?.[0]?.name || 'Autore sconosciuto',
        coverUrl: bookData.cover?.medium || bookData.cover?.small,
        description: bookData.notes,
        publishedDate: bookData.publish_date,
        publisher: bookData.publishers?.[0],
        isbn,
      };
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message === 'HTTP error! status: 429' 
          ? 'Troppe richieste, riprova tra qualche secondo'
          : 'Errore durante la ricerca del libro');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const searchByTitle = async (title: string): Promise<SearchBookResult[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Prima prova con Google Books
      try {
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}&langRestrict=it&orderBy=relevance&maxResults=5&key=${process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY}`;
        const data: GoogleBookResponse = await makeRequest(url);

        if (data.items?.length) {
          return data.items.slice(0, 5).map(transformGoogleBookToBook);
        }
      } catch (err) {
        console.log('Google Books API fallita, provo con Open Library');
      }

      // Fallback a Open Library
      const openLibraryResponse = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=5&language=ita`
      );
      const openLibraryData = await openLibraryResponse.json();

      if (!openLibraryData.docs?.length) {
        setError('Nessun libro trovato');
        return [];
      }

      return openLibraryData.docs.map(book => ({
        title: book.title,
        author: book.author_name?.[0] || 'Autore sconosciuto',
        genre: book.subject?.[0],
        coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : undefined,
        publishedDate: book.first_publish_year?.toString(),
        publisher: book.publisher?.[0],
        isbn: book.isbn?.[0],
      }));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message === 'HTTP error! status: 429'
          ? 'Troppe richieste, riprova tra qualche secondo'
          : 'Errore durante la ricerca dei libri');
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const transformGoogleBookToBook = (googleBook: GoogleBookResponse['items'][0]): SearchBookResult => {
    const isbn = googleBook.volumeInfo.industryIdentifiers?.find(
      id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    )?.identifier;

    // Garantiamo che title e author siano sempre presenti
    const title = googleBook.volumeInfo.title;
    const author = googleBook.volumeInfo.authors?.[0] || 'Autore sconosciuto';

    if (!title) {
      throw new Error('Book title is required');
    }

    return {
      title,
      author,
      genre: googleBook.volumeInfo.categories?.[0],
      coverUrl: googleBook.volumeInfo.imageLinks?.thumbnail,
      description: googleBook.volumeInfo.description,
      publishedDate: googleBook.volumeInfo.publishedDate,
      publisher: googleBook.volumeInfo.publisher,
      pageCount: googleBook.volumeInfo.pageCount,
      isbn,
    };
  };

  return { searchByTitle, searchByIsbn, isLoading, error };
}
