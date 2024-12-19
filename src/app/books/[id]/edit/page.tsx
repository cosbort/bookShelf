'use client';

import { useEffect, useState } from 'react';
import { BookForm } from '@/components/BookForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Book } from '@/types/book';

export default function EditBookPage() {
  const params = useParams();
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

  if (!book) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href={`/books/${book.id}`}>
          <Button variant="outline" className="mr-4">← Back to Book Details</Button>
        </Link>
        <h1 className="text-4xl font-bold">Edit Book</h1>
      </div>
      <div className="max-w-2xl">
        <BookForm initialBook={book} />
      </div>
    </div>
  );
}
