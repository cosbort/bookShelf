'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BookList } from "@/components/BookList";
import { LibraryImportExport } from "@/components/LibraryImportExport";
import { ScrollToTop } from '@/components/ScrollToTop';
import { useBooks } from '@/hooks/useBooks';
import { motion } from 'framer-motion';

export default function BooksPage() {
  const { refetch } = useBooks();

  const handleImport = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dei libri:', error);
    }
  }, [refetch]);

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

  return (
    <>
      <motion.div 
        className="container mx-auto px-4 py-8"
        initial="hidden"
        animate="show"
        variants={container}
      >
        <motion.div 
          className="flex items-center justify-between mb-8"
          variants={item}
        >
          <h2 className="text-3xl font-bold text-[hsl(var(--foreground))]">I miei libri</h2>
          <div className="flex gap-4">
            <LibraryImportExport onImport={handleImport} />
            <Link href="/books/new">
              <Button className="bg-[hsl(142,70%,35%)] hover:bg-[hsl(142,70%,30%)] text-white">
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi libro
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <BookList />
        </motion.div>
      </motion.div>
      <ScrollToTop />
    </>
  );
}
