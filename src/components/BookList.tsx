'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Book as BookIcon, Star, Filter, Eye, Info, ChevronDown, Bookmark, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooks } from '@/hooks/useBooks';
import { useBookStatus } from '@/hooks/useBookStatus';
import { formatDate } from '@/utils/dateFormat';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string | undefined;
  location: string | undefined;
  status: string;
  coverUrl?: string;
  rating?: number;
  pages?: number;
  year?: number;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  searchQuery?: string;
};

export function BookList({ searchQuery = '' }: Props) {
  const { books, isLoading, error, refetch } = useBooks();
  const { getStatusColor } = useBookStatus();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Estrai gli status unici dai libri
  const uniqueStatuses = [...new Set(books?.map(book => book.status) || [])];
  
  // Filtro dei libri in base alla query di ricerca e ai filtri attivi
  useEffect(() => {
    if (!books) return;
    
    let filtered = [...books];
    
    // Filtra per query di ricerca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(query) || 
        book.author.toLowerCase().includes(query) || 
        (book.isbn?.toLowerCase().includes(query) || false) ||
        (book.location?.toLowerCase().includes(query) || false)
      );
    }
    
    // Filtra per status attivi
    if (activeFilters.length > 0) {
      filtered = filtered.filter(book => activeFilters.includes(book.status));
    }
    
    setFilteredBooks(filtered);
  }, [books, searchQuery, activeFilters]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-[hsl(var(--background))] rounded-[var(--radius)] border border-[hsl(var(--border))]">
        <Info className="h-10 w-10 text-[hsl(var(--muted-foreground))] mb-2" />
        <h3 className="text-xl font-medium mb-2">Errore nel caricamento dei libri</h3>
        <p className="text-[hsl(var(--muted-foreground))] mb-4">{error.message}</p>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <RotateCw className="h-4 w-4" />
          Riprova
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Filtri e controlli */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="h-4 w-4" />
            Filtri {activeFilters.length > 0 && `(${activeFilters.length})`}
          </Button>
          
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFilters([])}
              className="text-xs"
            >
              Rimuovi filtri
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => refetch()}
          >
            <RotateCw className="h-3 w-3" />
            Aggiorna
          </Button>
          
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {filteredBooks.length} libri totali
          </p>
        </div>
      </div>
      
      {/* Popover per i filtri */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
            style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            <div className="p-4 border border-[hsl(var(--border))] rounded-[var(--radius)] bg-[hsl(var(--card))]">
              <h3 className="font-medium mb-3">Filtra per stato</h3>
              <div className="flex flex-wrap gap-3">
                {uniqueStatuses.map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={activeFilters.includes(status)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setActiveFilters([...activeFilters, status]);
                        } else {
                          setActiveFilters(activeFilters.filter(s => s !== status));
                        }
                      }}
                    />
                    <Label
                      htmlFor={`status-${status}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista dei libri */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col h-[420px] bg-[hsl(var(--card))] rounded-[var(--radius)] overflow-hidden border border-[hsl(var(--border))] shadow-xs">
              <div className="h-[320px] bg-[hsl(var(--muted))] rounded-t-[var(--radius)]">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="p-3 flex flex-col flex-grow">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <div className="mt-auto">
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-[hsl(var(--card))] rounded-[var(--radius)] border border-[hsl(var(--border))]">
          <BookIcon className="h-10 w-10 text-[hsl(var(--muted-foreground))] mb-2" />
          <h3 className="text-xl font-medium mb-2">Nessun libro trovato</h3>
          <p className="text-[hsl(var(--muted-foreground))]">
            {searchQuery 
              ? "La ricerca non ha prodotto risultati. Prova con termini diversi."
              : "Non ci sono libri nella tua libreria. Aggiungine uno per iniziare!"}
          </p>
        </div>
      )}
    </div>
  );
}

function BookCard({ book }: { book: Book }) {
  const { getStatusColor } = useBookStatus();
  
  // Correggiamo l'URL della copertina
  const coverImageUrl = book.coverUrl 
    ? book.coverUrl.startsWith('http') 
      ? book.coverUrl 
      : `/api/books/cover?isbn=${book.isbn}`
    : book.isbn 
      ? `/api/books/cover?isbn=${book.isbn}` 
      : null;
  
  return (
    <div className="group flex flex-col h-full rounded-[var(--radius)] overflow-hidden bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-xs hover:shadow-md transition-all duration-300">
      <Link href={`/books/${book.id}`} className="flex flex-col h-full no-underline">
        <div className="relative h-80 overflow-hidden bg-[hsl(var(--muted))] rounded-t-[var(--radius)]">
          {/* Gradient overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,0%)]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
          
          {/* Cover Image */}
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={`Copertina di ${book.title}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                // Fallback in caso di errore di caricamento dell'immagine
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://placehold.co/400x600/f0f0f0/333333?text=Nessuna+Copertina';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-gradient-to-b from-[hsl(var(--primary))]/10 to-[hsl(var(--background))]">
              <BookIcon className="h-10 w-10 text-[hsl(var(--primary))]/70 mb-2" />
              <p className="text-xs text-[hsl(var(--foreground))] font-medium line-clamp-3">
                {book.title}
              </p>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-2 right-2 z-20">
            <Badge 
              className="text-xs font-medium shadow-sm backdrop-blur-sm"
              style={{
                backgroundColor: `${getStatusColor(book.status)}30`,
                color: getStatusColor(book.status),
                borderColor: getStatusColor(book.status)
              }}
            >
              {book.status}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-col flex-grow p-3">
          <h3 className="font-medium text-sm mb-1 line-clamp-2">{book.title}</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-1 mb-2">
            {book.author || 'Autore sconosciuto'}
          </p>
          
          <div className="mt-auto flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
            <div className="flex items-center gap-2">
              {book.rating && book.rating > 0 && (
                <div className="flex items-center">
                  <Star className="h-3 w-3 fill-current mr-1" />
                  <span>{book.rating}</span>
                </div>
              )}
              {book.pages && book.pages > 0 && (
                <div className="flex items-center">
                  <BookIcon className="h-3 w-3 mr-1" />
                  <span>{book.pages} pp</span>
                </div>
              )}
            </div>
            {book.year && (
              <span>{book.year}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
