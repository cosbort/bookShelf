'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { Book } from '@/types/book';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    // TODO: Fetch book from API
    const sampleBook: Book = {
      id: params.id as string,
      title: 'Sample Book',
      author: 'Sample Author',
      genre: 'Fiction',
      status: 'Reading'
    };
    setBook(sampleBook);
  }, [params.id]);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this book?')) {
      // TODO: Delete book from API
      router.push('/books');
    }
  };

  if (!book) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/books">
          <Button variant="outline" className="mr-4">← Back to Books</Button>
        </Link>
        <h1 className="text-4xl font-bold">Book Details</h1>
      </div>

      <Card className="max-w-2xl mb-8">
        <CardHeader>
          <CardTitle>{book.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="font-semibold">Author</dt>
              <dd>{book.author}</dd>
            </div>
            <div>
              <dt className="font-semibold">Genre</dt>
              <dd>{book.genre}</dd>
            </div>
            <div>
              <dt className="font-semibold">Status</dt>
              <dd>{book.status}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Link href={`/books/${book.id}/edit`}>
          <Button>Edit Book</Button>
        </Link>
        <Button variant="destructive" onClick={handleDelete}>
          Delete Book
        </Button>
      </div>
    </div>
  );
}
