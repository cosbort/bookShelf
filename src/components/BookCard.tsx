'use client';

import type { Book } from '@/types/book';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
        className="group flex flex-col h-[350px] rounded-lg overflow-hidden bg-card border border-border shadow-xs hover:shadow-md hover:border-primary/30 transition-all duration-300"
      >
        <Link href={`/books/${book.id}`} className="flex flex-col h-full no-underline">
          <div className="relative h-[200px] overflow-hidden bg-muted rounded-t-lg">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                className="h-full w-full object-cover"
                fill
                sizes="128px"
                priority={true}
                quality={80}
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkLzYvLy0vLi43QzlANz45Ny4tRUhESkQ6Tj5UVkZIVENKTUhKTj7/2wBDAR"
                placeholder="blur"
              />
            ) : (
              <div 
                className="flex flex-col items-center justify-center h-full p-4 text-center bg-gradient-to-b from-primary/10 to-background"
              >
                <BookOpen className="h-10 w-10 text-primary/70 mb-2" />
                <p className="text-xs text-foreground font-medium line-clamp-3">
                  {book.title}
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col flex-grow p-3">
            <h3 className="font-medium text-sm mb-1 line-clamp-2">{book.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
              {book.author || 'Autore sconosciuto'}
            </p>
            <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {book.rating && book.rating > 0 && (
                  <div className="flex items-center">
                    <Star className="h-3 w-3 fill-current text-yellow-400" />
                    <span className="ml-1">{book.rating}</span>
                  </div>
                )}
                {book.pages && (
                  <div className="flex items-center">
                    <BookOpen className="h-3 w-3" />
                    <span className="ml-1">{book.pages} pagine</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`ml-2 ${statusColors[book.status]} status-badge`}>
                  {book.status}
                </Badge>
              </div>
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  );
}
