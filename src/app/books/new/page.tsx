'use client';

import { BookForm } from '@/components/BookForm';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Book } from '@/types/book';

export default function NewBookPage() {
  const router = useRouter();

  const handleSubmit = async (bookData: Omit<Book, 'id'>) => {
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante il salvataggio del libro');
      }

      const book = await response.json();
      toast.success('Libro aggiunto con successo!');
      router.push('/books');
      router.refresh();
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      toast.error('Errore durante il salvataggio del libro', {
        description: error instanceof Error ? error.message : 'Si è verificato un errore imprevisto',
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Aggiungi un nuovo libro</h1>
      <BookForm onSubmit={handleSubmit} />
    </div>
  );
}
