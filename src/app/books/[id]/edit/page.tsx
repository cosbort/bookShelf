'use client';

import { BookForm } from '@/components/BookForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useBook } from '@/hooks/useBook';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { Book } from '@/types/book';
import { toast } from 'sonner';

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const { book, isLoading, error } = useBook(params.id as string);

  const handleSubmit = async (updatedBook: Omit<Book, 'id'>) => {
    try {
      const response = await fetch(`/api/books/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedBook),
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'aggiornamento del libro');
      }

      toast.success('Libro aggiornato con successo');
      router.push(`/books/${params.id}`);
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Si è verificato un errore durante l\'aggiornamento del libro');
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>
            Si è verificato un errore durante il caricamento dei dettagli del libro.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Skeleton className="h-10 w-32 mr-4" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href={`/books/${book.id}`}>
          <Button variant="outline" className="mr-4">← Torna ai Dettagli</Button>
        </Link>
        <h1 className="text-4xl font-bold">Modifica Libro</h1>
      </div>
      <div className="max-w-2xl">
        <BookForm 
          initialBook={book} 
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
