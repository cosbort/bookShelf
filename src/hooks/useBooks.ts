import { useState, useEffect } from 'react';
import type { Book } from '@/types/book';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks(): Promise<void> {
    try {
      const response = await fetch('/api/books');
      if (!response.ok) throw new Error('Errore nel caricamento dei libri');
      const data = await response.json();
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  }

  async function addBook(book: Omit<Book, 'id'>): Promise<void> {
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      });
      if (!response.ok) throw new Error('Errore nell\'aggiunta del libro');
      await fetchBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    }
  }

  return { books, isLoading, error, addBook };
}
