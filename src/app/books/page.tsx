'use client';

import { Button } from '@/components/ui/button';
import { BookOpen, Upload, Download, Search } from 'lucide-react';
import { BookList } from '@/components/BookList';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { BookImportModal } from '@/components/BookImportModal';
import { BookExportModal } from '@/components/BookExportModal';

export default function BooksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Hero section */}
      <motion.div 
        className="relative mb-8 rounded-[var(--radius)] overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-[hsl(var(--primary))/20] to-transparent p-8 rounded-[var(--radius)]">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-[hsl(var(--primary))] shadow-glow rounded-full p-1" />
            <h1 className="text-3xl font-bold tracking-tight">I miei libri</h1>
          </div>
          <p className="text-[hsl(var(--muted-foreground))] max-w-3xl mb-6">
            Gestisci la tua collezione personale di libri
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input 
                className="pl-10 bg-[hsl(var(--background))] border-[hsl(var(--border))]" 
                placeholder="Cerca per titolo, autore, ISBN o posizione..." 
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 hover:bg-[hsl(var(--primary))/10]"
                onClick={() => setIsImportModalOpen(true)}
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Importa CSV</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 hover:bg-[hsl(var(--primary))/10]"
                onClick={() => setIsExportModalOpen(true)}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Esporta CSV</span>
              </Button>
            </div>
            
            <Button asChild className="shadow-glow">
              <Link href="/books/new">
                + Aggiungi libro
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      <BookList searchQuery={searchQuery} />
      
      <BookImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
      
      <BookExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
