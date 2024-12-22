'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useBook } from '@/hooks/useBook';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/dateFormat';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { book, isLoading, error } = useBook(params.id as string);

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo libro?')) {
      return;
    }

    try {
      const response = await fetch(`/api/books/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione del libro');
      }

      router.push('/books');
    } catch (error) {
      console.error('Errore:', error);
      alert('Si è verificato un errore durante l\'eliminazione del libro');
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
        <Card className="max-w-2xl mb-8">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-6 w-24" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/books">
          <Button variant="outline" className="mr-4">← Torna ai Libri</Button>
        </Link>
        <h1 className="text-4xl font-bold">Dettagli Libro</h1>
      </div>

      <Card className="max-w-2xl mb-8">
        <CardHeader>
          <CardTitle>{book.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Autore</h3>
            <p>{book.author}</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Genere</h3>
            <p>{book.genre}</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Stato</h3>
            <p>{book.status}</p>
          </div>
          {book.publishedDate && (
            <div>
              <h3 className="font-semibold text-lg">Data di Pubblicazione</h3>
              <p>{formatDate(book.publishedDate)}</p>
            </div>
          )}
          {book.isbn && (
            <div>
              <h3 className="font-semibold text-lg">ISBN</h3>
              <p>{book.isbn}</p>
            </div>
          )}
          {book.description && (
            <div>
              <h3 className="font-semibold text-lg">Descrizione</h3>
              <p className="text-muted-foreground">{book.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex space-x-4">
        <Link href={`/books/${book.id}/edit`}>
          <Button>Modifica Libro</Button>
        </Link>
        <Button variant="destructive" onClick={handleDelete}>
          Elimina Libro
        </Button>
      </div>
    </div>
  );
}
