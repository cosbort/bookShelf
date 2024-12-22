'use client';

import { useEffect, useState } from 'react';
import { BookCard } from '@/components/BookCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Book } from '@/types/book';
import { useBooks } from '@/hooks/useBooks';
import { motion } from 'framer-motion';
import { Search, Plus, Library } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function BooksPage() {
  const { books, isLoading } = useBooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Library className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">La Tua Libreria</h1>
        </div>
        <Link href="/books/add">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Aggiungi Libro</span>
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cerca per titolo, autore o ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Books Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {books
          ?.filter((book) => {
            const searchMatch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
              book.isbn.includes(searchTerm);
            const statusMatch = !selectedStatus || book.status === selectedStatus;
            return searchMatch && statusMatch;
          })
          .map((book) => (
            <motion.div key={book.id} variants={item}>
              <Link href={`/books/${book.id}`}>
                <BookCard book={book} />
              </Link>
            </motion.div>
          ))}
      </motion.div>

      {/* Empty State */}
      {!isLoading && (!books || books.length === 0) && (
        <div className="text-center py-12">
          <Library className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nessun libro trovato</h3>
          <p className="mt-2 text-muted-foreground">
            Inizia ad aggiungere libri alla tua collezione
          </p>
          <Link href="/books/add">
            <Button className="mt-4">
              Aggiungi il tuo primo libro
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
