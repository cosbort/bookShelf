'use client';

import type { Book } from '@/types/book';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, MapPin, Calendar, Star } from 'lucide-react';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const router = useRouter();

  const statusColors = {
    'To Read': 'bg-[hsl(50,100%,85%)] text-[hsl(50,100%,20%)]',
    'Reading': 'bg-[hsl(210,100%,85%)] text-[hsl(210,100%,20%)]',
    'Read': 'bg-[hsl(142,70%,85%)] text-[hsl(142,70%,20%)]',
    'Completed': 'bg-[hsl(280,70%,85%)] text-[hsl(280,70%,20%)]',
    'Dropped': 'bg-[hsl(0,70%,85%)] text-[hsl(0,70%,20%)]',
  };

  const handleClick = () => {
    router.push(`/books/${book.id}`);
  };

  // Calcola le dimensioni della copertina mantenendo l'aspect ratio
  const coverWidth = 128; // Larghezza fissa
  const coverHeight = book.coverHeight && book.coverWidth 
    ? Math.round((coverWidth / book.coverWidth) * book.coverHeight)
    : 192; // Altezza predefinita se non abbiamo le dimensioni originali

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className="animate-fadeIn"
    >
      <Card 
        onClick={handleClick}
        className="book-card h-full flex flex-col cursor-pointer shadow-3d"
      >
        <CardHeader className="flex-grow-0 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold line-clamp-2">{book.title}</CardTitle>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{book.author}</p>
            </div>
            <Badge className={`ml-2 ${statusColors[book.status]} status-badge`}>
              {book.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col pt-0">
          <div className="flex gap-4 mb-4">
            {book.coverUrl ? (
              <div 
                className="book-card-image relative flex-shrink-0 rounded-[var(--radius)] overflow-hidden"
                style={{ width: coverWidth, height: coverHeight }}
              >
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="128px"
                  priority={true}
                  quality={80}
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkLzYvLy0vLi43QzlANz45Ny4tRUhESkQ6Tj5UVkZIVENKTUhKTj7/2wBDAR"
                  placeholder="blur"
                />
                <div className="book-card-image-overlay">
                  <div className="book-card-image-overlay-content">
                    <h3>{book.title}</h3>
                    <p>{book.author}</p>
                    {book.location && (
                      <div className="flex items-center gap-1 mt-2 text-xs">
                        <MapPin className="h-3 w-3" />
                        <span>{book.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="book-card-image bg-[hsl(var(--muted))] rounded-[var(--radius)] flex items-center justify-center flex-shrink-0"
                style={{ width: coverWidth, height: coverHeight }}
              >
                <BookOpen className="h-16 w-16 text-[hsl(var(--muted-foreground))]" />
              </div>
            )}
            <div className="flex-1">
              {book.description && (
                <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-4">
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
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    ISBN: {book.isbn}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-auto pt-4 border-t border-[hsl(var(--border))] flex flex-wrap gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            {book.publisher && (
              <div className="flex items-center gap-1">
                <span>{book.publisher}</span>
              </div>
            )}
            {book.publishedDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{book.publishedDate}</span>
              </div>
            )}
            {book.pageCount && (
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>{book.pageCount} pagine</span>
              </div>
            )}
            {book.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>{book.rating}/5</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
