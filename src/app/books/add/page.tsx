'use client';

import { BookForm } from '@/components/BookForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Book } from '@/types/book';

export default function AddBookPage() {
  const router = useRouter();

  const handleAddBook = async (book: Omit<Book, 'id'>) => {
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(book),
      });

      if (!response.ok) {
        throw new Error('Errore durante il salvataggio del libro');
      }

      router.push('/books');
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      // Qui potresti aggiungere una notifica di errore all'utente
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/books">
          <Button variant="outline" className="mr-4">← Back to Books</Button>
        </Link>
        <h1 className="text-4xl font-bold">Add New Book</h1>
      </div>
      <div className="max-w-2xl">
        <BookForm onSubmit={handleAddBook} />
      </div>
    </div>
  );
}
