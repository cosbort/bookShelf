import { useState, useRef } from 'react';
import type { Book, SearchBookResult } from '@/types/book';

interface OpenLibraryResponse {
  docs: Array<{
    key: string;
    title: string;
    author_name?: string[];
    isbn?: string[];
    cover_i?: number;
    first_publish_year?: number;
    publisher?: string[];
    number_of_pages_median?: number;
    subject?: string[];
  }>;
}

export function useOpenLibrarySearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRequestTime = useRef<number>(0);
  const MIN_REQUEST_INTERVAL = 1000;

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

  const transformOpenLibraryToBook = (item: OpenLibraryResponse['docs'][0]): SearchBookResult => {
    return {
      title: item.title,
      author: item.author_name?.[0] || 'Autore sconosciuto',
      isbn: item.isbn?.[0] || '',
      coverUrl: item.cover_i 
        ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`
        : '',
      publishedDate: item.first_publish_year?.toString() || '',
      publisher: item.publisher?.[0] || '',
      pageCount: item.number_of_pages_median || 0,
      description: '',
      genre: item.subject?.[0] || ''
    };
  };

  const searchByTitle = async (title: string): Promise<SearchBookResult[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await waitForRateLimit();
      
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=5&language=ita&fields=key,title,author_name,isbn,cover_i,first_publish_year,publisher,number_of_pages_median,subject`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: OpenLibraryResponse = await response.json();
      
      if (!data.docs?.length) {
        return [];
      }
      
      return data.docs.map(transformOpenLibraryToBook);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante la ricerca';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const searchByIsbn = async (isbn: string): Promise<SearchBookResult | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await waitForRateLimit();
      
      const response = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const bookData = data[`ISBN:${isbn}`];
      
      if (!bookData) {
        return null;
      }
      
      return {
        title: bookData.title,
        author: bookData.authors?.[0]?.name || 'Autore sconosciuto',
        isbn,
        coverUrl: bookData.cover?.large || bookData.cover?.medium || '',
        description: bookData.notes || '',
        publishedDate: bookData.publish_date || '',
        publisher: bookData.publishers?.[0] || '',
        pageCount: bookData.number_of_pages || 0,
        genre: bookData.subjects?.[0] || ''
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante la ricerca';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    searchByTitle,
    searchByIsbn
  };
}
