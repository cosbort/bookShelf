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

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.genre.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !selectedStatus || book.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = books.reduce((acc, book) => {
    acc[book.status] = (acc[book.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <Library className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              La Mia Libreria
            </h1>
          </div>
          <Link href="/books/add">
            <Button className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Libro
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {['To Read', 'Reading', 'Read'].map(status => (
            <motion.button
              key={status}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
              className={`p-4 rounded-lg ${
                selectedStatus === status 
                  ? 'bg-primary text-white' 
                  : 'bg-white hover:bg-gray-50'
              } shadow-sm transition-colors`}
            >
              <div className="text-2xl font-bold">{statusCounts[status] || 0}</div>
              <div className="text-sm">{status}</div>
            </motion.button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Cerca per titolo, autore o genere..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredBooks.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                Nessun libro trovato
              </div>
            ) : (
              filteredBooks.map(book => (
                <motion.div key={book.id} variants={item}>
                  <Link href={`/books/${book.id}`}>
                    <BookCard book={book} />
                  </Link>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
