import { useState, useEffect } from 'react';
import type { Book } from '@/types/book';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/books');
      if (!response.ok) throw new Error('Failed to fetch books');
      const data = await response.json();
      setBooks(data);
    } catch (err) {
      setError('Error fetching books');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const addBook = async (bookData: Omit<Book, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
      });
      if (!response.ok) throw new Error('Failed to add book');
      const newBook = await response.json();
      setBooks(prev => [newBook, ...prev]);
      return newBook;
    } catch (err) {
      setError('Error adding book');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBook = async (id: string, bookData: Partial<Book>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
      });
      if (!response.ok) throw new Error('Failed to update book');
      const updatedBook = await response.json();
      setBooks(prev => prev.map(book => 
        book.id === id ? updatedBook : book
      ));
      return updatedBook;
    } catch (err) {
      setError('Error updating book');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBook = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete book');
      setBooks(prev => prev.filter(book => book.id !== id));
    } catch (err) {
      setError('Error deleting book');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return {
    books,
    isLoading,
    error,
    fetchBooks,
    addBook,
    updateBook,
    deleteBook,
  };
}
