'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BookList } from "@/components/BookList";
import { LibraryImportExport } from "@/components/LibraryImportExport";
import { ScrollToTop } from '@/components/ScrollToTop';
import { useBooks } from '@/hooks/useBooks';

export default function BooksPage() {
  const { refetch } = useBooks();

  const handleImport = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dei libri:', error);
    }
  }, [refetch]);

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
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

        <BookList />
      </div>
      <ScrollToTop />
    </>
  );
}
