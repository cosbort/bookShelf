'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Book as BookIcon, Star, Filter, Eye, Info, ChevronDown, Bookmark, RotateCw, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooks } from '@/hooks/useBooks';
import { useBookStatus } from '@/hooks/useBookStatus';
import { formatDate } from '@/utils/dateFormat';
import { getBadgeColors } from '@/utils/badgeColors';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Book } from '@/types/book';

// Definizione dei tipi di ordinamento disponibili
type SortOption = {
  value: string;
  label: string;
  sortFn: (a: Book, b: Book) => number;
};

type Props = {
  searchQuery?: string;
};

// Funzione di utilità per ottenere la prima lettera di una stringa
function getFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase();
}

// Funzione per raggruppare i libri per lettera del titolo o dell'autore
function groupBooksByLetter(books: Book[], sortBy: string): Map<string, Book[]> {
  const groups = new Map<string, Book[]>();
  
  books.forEach(book => {
    // Determina il campo da usare per il raggruppamento
    const field = sortBy.startsWith('author') ? book.author : book.title;
    const letter = field.charAt(0).toUpperCase();
    
    if (!groups.has(letter)) {
      groups.set(letter, []);
    }
    groups.get(letter)?.push(book);
  });
  
  return new Map([...groups.entries()].sort());
}

export function BookList({ searchQuery = '' }: Props) {
  const { books, isLoading, error, refetch } = useBooks();
  const { getStatusColor } = useBookStatus();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('titleAsc');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const letterRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Opzioni di ordinamento disponibili
  const sortOptions: SortOption[] = [
    { 
      value: 'titleAsc', 
      label: 'Titolo (A-Z)', 
      sortFn: (a, b) => a.title.localeCompare(b.title) 
    },
    { 
      value: 'titleDesc', 
      label: 'Titolo (Z-A)', 
      sortFn: (a, b) => b.title.localeCompare(a.title) 
    },
    { 
      value: 'authorAsc', 
      label: 'Autore (A-Z)', 
      sortFn: (a, b) => a.author.localeCompare(b.author) 
    },
    { 
      value: 'authorDesc', 
      label: 'Autore (Z-A)', 
      sortFn: (a, b) => b.author.localeCompare(a.author) 
    },
    { 
      value: 'ratingDesc', 
      label: 'Valutazione (alta-bassa)', 
      sortFn: (a, b) => (b.rating || 0) - (a.rating || 0) 
    },
    { 
      value: 'yearDesc', 
      label: 'Anno (recente-vecchio)', 
      sortFn: (a, b) => (b.yearPublished || 0) - (a.yearPublished || 0) 
    },
    { 
      value: 'yearAsc', 
      label: 'Anno (vecchio-recente)', 
      sortFn: (a, b) => (a.yearPublished || 0) - (b.yearPublished || 0) 
    },
    { 
      value: 'recentlyAdded', 
      label: 'Aggiunti di recente', 
      sortFn: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() 
    }
  ];

  // Estrai gli status unici dai libri
  const uniqueStatuses = [...new Set(books?.map(book => book.status) || [])];
  
  // Raggruppa i libri per lettera
  const groupedBooks = useMemo(() => {
    return groupBooksByLetter(filteredBooks, sortBy);
  }, [filteredBooks, sortBy]);

  // Lista di tutte le lettere disponibili
  const availableLetters = useMemo(() => {
    return Array.from(groupedBooks.keys());
  }, [groupedBooks]);

  // Funzione per scorrere alla lettera selezionata
  const scrollToLetter = (letter: string) => {
    const element = letterRefs.current.get(letter);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSelectedLetter(letter);
      // Reset della lettera selezionata dopo un breve delay
      setTimeout(() => setSelectedLetter(null), 1000);
    }
  };
  
  // Filtro e ordinamento dei libri
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
    
    // Ordina i libri in base all'opzione selezionata
    const selectedSortOption = sortOptions.find(option => option.value === sortBy);
    if (selectedSortOption) {
      filtered.sort(selectedSortOption.sortFn);
    }
    
    setFilteredBooks(filtered);
  }, [books, searchQuery, activeFilters, sortBy]);

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
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Selettore di ordinamento */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <ArrowUpDown className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Ordina per" />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--background))] border border-[hsl(var(--border))]">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {/* Lista dei libri con indice alfabetico */}
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
        <div className="relative flex">
          {/* Lista dei libri raggruppati per lettera */}
          <div className="flex-1 pr-8">
            {Array.from(groupedBooks.entries()).map(([letter, books]) => (
              <div 
                key={letter}
                ref={(el) => {
                  if (el) letterRefs.current.set(letter, el);
                }}
                className="mb-8"
              >
                <div className="sticky top-0 z-10 py-2 mb-4">
                  <div className="bg-[hsl(var(--card))]/80 backdrop-blur-sm border-b border-[hsl(var(--border))] px-4 py-2 rounded-t-[var(--radius)]">
                    <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
                      {letter}
                    </h2>
                    {sortBy.startsWith('author') && (
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        {books.length} {books.length === 1 ? 'autore' : 'autori'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {books.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Indice alfabetico laterale */}
          {availableLetters.length > 0 && (
            <div className="hidden lg:flex flex-col fixed right-4 top-1/2 -translate-y-1/2 bg-[hsl(var(--background))]/80 backdrop-blur-sm rounded-full py-2 border border-[hsl(var(--border))]">
              {availableLetters.map((letter) => (
                <button
                  key={letter}
                  onClick={() => scrollToLetter(letter)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center text-xs font-medium rounded-full transition-colors",
                    selectedLetter === letter
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
                  )}
                >
                  {letter}
                </button>
              ))}
            </div>
          )}
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
            <Image
              src={coverImageUrl}
              alt={`Copertina di ${book.title}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              width={500}
              height={800}
              unoptimized={coverImageUrl.startsWith('/api/')}
              onError={() => {
                // Fallback in caso di errore di caricamento dell'immagine
                const imgElement = document.getElementById(`cover-${book.id}`) as HTMLImageElement;
                if (imgElement) {
                  imgElement.src = 'https://placehold.co/400x600/f0f0f0/333333?text=Nessuna+Copertina';
                }
              }}
              id={`cover-${book.id}`}
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
              className="text-xs font-bold shadow-sm backdrop-blur-sm transition-all duration-200 px-3 py-1"
              style={{
                backgroundColor: getBadgeColors(book.status).bg,
                color: getBadgeColors(book.status).text,
                borderColor: getBadgeColors(book.status).border,
                borderWidth: '1.5px'
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
              {book.pageCount && book.pageCount > 0 && (
                <div className="flex items-center">
                  <BookIcon className="h-3 w-3 mr-1" />
                  <span>{book.pageCount} pp</span>
                </div>
              )}
            </div>
            {book.yearPublished && (
              <span>{book.yearPublished}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
