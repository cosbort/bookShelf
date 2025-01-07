'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBooks } from '@/hooks/useBooks';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Library,
  Book as BookIcon,
  Bookmark as BookmarkIcon,
  Building as BuildingLibraryIcon
} from 'lucide-react';
import { formatDate } from '@/utils/dateFormat';
import { BookList } from "@/components/BookList";
import { LibraryImportExport } from "@/components/LibraryImportExport";
import { ScrollToTop } from '@/components/ScrollToTop';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { BookCard } from '@/components/BookCard';

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
  const { books, isLoading, refetch } = useBooks();
  const [searchTerm, setSearchTerm] = useState('');

  const handleImport = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dei libri:', error);
    }
  }, [refetch]);

  const filteredBooks = books?.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn?.includes(searchTerm)
  ) ?? [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">I miei libri</h2>
            <div className="flex gap-4">
              <LibraryImportExport onImport={handleImport} />
              <Link href="/books/new">
                <Button className="button-hover bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi libro
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-4">
            <Input
              type="text"
              placeholder="Cerca per titolo, autore o ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </div>

        <div className="mt-8">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </motion.div>
        </div>
      </div>
      <ScrollToTop />
    </>
  );
}
