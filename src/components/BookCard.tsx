'use client';

import type { Book } from '@/types/book';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const statusColors = {
    'To Read': 'bg-yellow-200 hover:bg-yellow-300',
    'Reading': 'bg-blue-200 hover:bg-blue-300',
    'Read': 'bg-green-200 hover:bg-green-300',
    'Completed': 'bg-purple-200 hover:bg-purple-300',
    'Dropped': 'bg-red-200 hover:bg-red-300',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
      <CardHeader className="flex-grow-0">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold line-clamp-2">{book.title}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">{book.author}</p>
          </div>
          <Badge className={`ml-2 ${statusColors[book.status]}`}>
            {book.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <div className="flex gap-4 mb-4">
          {book.coverUrl ? (
            <div className="relative w-24 h-36 flex-shrink-0">
              <Image
                src={book.coverUrl}
                alt={book.title}
                fill
                className="object-cover rounded-md"
              />
            </div>
          ) : (
            <div className="w-24 h-36 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-gray-400">No Cover</span>
            </div>
          )}
          <div className="flex-1">
            {book.description && (
              <p className="text-sm text-gray-600 line-clamp-4">
                {book.description}
              </p>
            )}
            <div className="mt-2 space-y-1">
              {book.genre && (
                <Badge variant="outline" className="mr-2">
                  {book.genre}
                </Badge>
              )}
              {book.isbn && (
                <p className="text-xs text-gray-500">
                  ISBN: {book.isbn}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-auto pt-4 border-t flex justify-between text-xs text-gray-500">
          {book.publisher && <span>{book.publisher}</span>}
          {book.publishedDate && <span>{book.publishedDate}</span>}
          {book.pageCount && <span>{book.pageCount} pagine</span>}
        </div>
      </CardContent>
    </Card>
  );
}
