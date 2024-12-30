import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Book } from '@/types/book';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function fetchBooks() {
    try {
      const response = await fetch('/api/books');
      if (!response.ok) {
        throw new Error('Errore nel caricamento dei libri');
      }
      const data = await response.json();
      setBooks(data);
    } catch (err) {
      setError(err as Error);
      toast.error('Errore nel caricamento dei libri');
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteBook(id: string) {
    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Errore nella cancellazione del libro');
      }
      
      setBooks(books.filter(book => book.id !== id));
      toast.success('Libro eliminato con successo');
    } catch (err) {
      toast.error('Errore nella cancellazione del libro');
      throw err;
    }
  }

  async function updateBook(id: string, data: Partial<Book>) {
    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Errore nell\'aggiornamento del libro');
      }
      
      const updatedBook = await response.json();
      setBooks(books.map(book => book.id === id ? updatedBook : book));
      toast.success('Libro aggiornato con successo');
      return updatedBook;
    } catch (err) {
      toast.error('Errore nell\'aggiornamento del libro');
      throw err;
    }
  }

  async function addBook(data: Omit<Book, 'id'>) {
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Errore nell\'aggiunta del libro');
      }
      
      const newBook = await response.json();
      setBooks([...books, newBook]);
      toast.success('Libro aggiunto con successo');
      return newBook;
    } catch (err) {
      toast.error('Errore nell\'aggiunta del libro');
      throw err;
    }
  }

  useEffect(() => {
    fetchBooks();
  }, []);

  return {
    books,
    isLoading,
    error,
    deleteBook,
    updateBook,
    addBook,
    refetch: fetchBooks,
  };
}
