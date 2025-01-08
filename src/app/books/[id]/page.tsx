'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useBook } from '@/hooks/useBook';
import { AlertCircle, Book as BookIcon, Calendar, Hash, Info, MapPin, Star, Type, User } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/dateFormat';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

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
        <Card className="max-w-4xl mb-8">
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

  const statusColors = {
    'To Read': 'bg-yellow-200 text-yellow-800',
    'Reading': 'bg-blue-200 text-blue-800',
    'Read': 'bg-green-200 text-green-800',
    'Completed': 'bg-purple-200 text-purple-800',
    'Dropped': 'bg-red-200 text-red-800',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/books">
          <Button variant="outline" className="mr-4">← Torna ai Libri</Button>
        </Link>
        <h1 className="text-4xl font-bold">Dettagli Libro</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Copertina del libro */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            {book.coverUrl ? (
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                <Image
                  src={book.coverUrl}
                  alt={`Copertina di ${book.title}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            ) : (
              <div className="aspect-[2/3] bg-muted rounded-lg flex items-center justify-center">
                <BookIcon className="h-20 w-20 text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informazioni principali */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex flex-col space-y-2">
              <CardTitle className="text-3xl">{book.title}</CardTitle>
              {book.originalTitle && (
                <p className="text-lg text-muted-foreground">
                  Titolo originale: {book.originalTitle}
                </p>
              )}
              {book.subtitle && (
                <p className="text-lg text-muted-foreground">
                  {book.subtitle}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Autore</h3>
                  <p>{book.authorLastFirst || book.author}</p>
                  {book.translator && (
                    <p className="text-sm text-muted-foreground">
                      Tradotto da: {book.translator}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Type className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Genere</h3>
                  <p>{book.genre || 'Non specificato'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Stato</h3>
                  <Badge className={statusColors[book.status] || 'bg-gray-200'}>
                    {book.status}
                  </Badge>
                  {book.currentPage && book.pageCount && (
                    <p className="text-sm mt-1">
                      Pagina {book.currentPage} di {book.pageCount}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Date</h3>
                  {book.publishedDate && (
                    <p>Pubblicato: {formatDate(book.publishedDate)}</p>
                  )}
                  {book.dateStarted && (
                    <p>Iniziato: {formatDate(book.dateStarted.toString())}</p>
                  )}
                  {book.dateFinished && (
                    <p>Finito: {formatDate(book.dateFinished.toString())}</p>
                  )}
                </div>
              </div>

              {book.isbn && (
                <div className="flex items-start space-x-3">
                  <Hash className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">ISBN</h3>
                    <p>{book.isbn}</p>
                  </div>
                </div>
              )}

              {(book.rating || book.location) && (
                <div className="flex items-start space-x-3">
                  {book.rating ? (
                    <>
                      <Star className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">Valutazione</h3>
                        <p>{book.rating}/5</p>
                      </div>
                    </>
                  ) : book.location && (
                    <>
                      <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">Posizione</h3>
                        <p>{book.location}</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Descrizione e Note */}
      {(book.description || book.notes) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Dettagli Aggiuntivi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {book.description && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Descrizione</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {book.description}
                </p>
              </div>
            )}
            {book.notes && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Note Personali</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {book.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
