import { useState, useEffect } from 'react';
import type { Book } from '@/types/book';

/**
 * Hook per recuperare i dettagli di un libro specifico
 * @param id - ID del libro da recuperare
 * @returns Oggetto contenente il libro, lo stato di caricamento e eventuali errori
 */
export function useBook(id: string) {
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBook() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/books/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch book details');
        }
        const data = await response.json();
        setBook(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchBook();
    }
  }, [id]);

  return { book, isLoading, error };
}
