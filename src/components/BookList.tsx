import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, BookOpen, Calendar, Star } from "lucide-react";
import { useBooks } from "@/hooks/useBooks";
import type { Book } from "@/types/book";
import { formatDate } from "@/utils/dateFormat";
import { cn } from "@/lib/utils";

const statusColors = {
  'To Read': 'bg-[hsl(210,100%,85%)] text-[hsl(210,100%,20%)] border-[hsl(210,100%,50%)]',
  'Reading': 'bg-[hsl(50,100%,85%)] text-[hsl(50,100%,20%)] border-[hsl(50,100%,50%)]',
  'Read': 'bg-[hsl(142,70%,85%)] text-[hsl(142,70%,20%)] border-[hsl(142,70%,50%)]',
  'Completed': 'bg-[hsl(160,70%,85%)] text-[hsl(160,70%,20%)] border-[hsl(160,70%,50%)]',
  'Dropped': 'bg-[hsl(0,70%,85%)] text-[hsl(0,70%,20%)] border-[hsl(0,70%,50%)]',
} as const;

export function BookList() {
  const { books, isLoading, error } = useBooks();
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyWithLocation, setShowOnlyWithLocation] = useState(false);

  // Debug dei libri caricati
  useEffect(() => {
    if (books) {
      console.log('=== STATO INIZIALE LIBRI ===');
      console.log('Totale libri caricati:', books.length);
      console.log('Primi 5 libri:', books.slice(0, 5));

      const booksWithLocation = books.filter(b => b.location && b.location.trim() !== '');
      console.log('Libri con location:', booksWithLocation.length);

      // Log dettagliato dei primi 5 libri
      console.log('=== PRIMI 5 LIBRI ===');
      books.slice(0, 5).forEach(book => {
        console.log(`Libro: "${book.title}"`, {
          hasLocation: Boolean(book.location),
          locationTrimmed: book.location?.trim(),
          locationLength: book.location?.length,
          location: book.location
        });
      });
    }
  }, [books]);

  // Filtra i libri
  const filteredBooks = useMemo(() => {
    if (!books || isLoading) return [];
    
    console.log('=== INIZIO FILTRO ===');
    console.log('Stato filtro location:', showOnlyWithLocation);
    console.log('Termine ricerca:', searchTerm);

    return books.filter((book) => {
      // Debug del filtro location
      if (showOnlyWithLocation) {
        const hasLocation = Boolean(book.location && book.location.trim() !== '');
        console.log(`Filtro location - Libro "${book.title}":`, {
          hasLocation,
          locationExists: Boolean(book.location),
          locationTrimmed: book.location?.trim(),
          locationLength: book.location?.length,
          location: book.location,
          included: hasLocation
        });
        if (!hasLocation) return false;
      }

      // Se non c'è termine di ricerca, mostra tutti
      if (!searchTerm.trim()) return true;

      // Debug della ricerca
      const searchTermLower = searchTerm.toLowerCase().trim();
      const fields = {
        title: (book.title || '').toLowerCase(),
        author: (book.author || '').toLowerCase(),
        isbn: (book.isbn || '').toLowerCase(),
        location: (book.location || '').toLowerCase(),
      };

      const matches = Object.entries(fields).map(([field, value]) => ({
        field,
        value,
        matches: value.includes(searchTermLower)
      }));

      const isMatch = matches.some(m => m.matches);
      console.log(`Ricerca "${searchTermLower}" - Libro "${book.title}":`, {
        fields,
        matches: matches.filter(m => m.matches).map(m => m.field),
        included: isMatch
      });
      return isMatch;
    });
  }, [books, searchTerm, showOnlyWithLocation, isLoading]);

  // Debug dei risultati
  useEffect(() => {
    console.log('=== RISULTATI FILTRO ===');
    console.log('Totale libri:', books?.length);
    console.log('Libri filtrati:', filteredBooks.length);
    console.log('Primi 5 libri filtrati:');
    filteredBooks.slice(0, 5).forEach(book => {
      console.log(`- "${book.title}" (Location: "${book.location}")`);
    });
  }, [books?.length, filteredBooks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[hsl(var(--muted-foreground))] flex flex-col items-center"
        >
          <div className="w-16 h-16 border-4 border-t-[hsl(var(--primary))] border-[hsl(var(--muted))] rounded-full animate-spin mb-4"></div>
          <span>Caricamento libri...</span>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[hsl(0,70%,50%)] flex flex-col items-center"
        >
          <span className="text-xl mb-2">⚠️</span>
          <span>Errore nel caricamento dei libri</span>
        </motion.div>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[hsl(var(--muted-foreground))] flex flex-col items-center"
        >
          <span className="text-xl mb-2">📚</span>
          <span>Nessun libro trovato</span>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col gap-4">
        {/* Campo di ricerca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Cerca per titolo, autore, ISBN o posizione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] shadow-3d"
          />
        </div>

        {/* Pulsante filtro location */}
        <button
          onClick={() => {
            console.log('=== CLICK PULSANTE LOCATION ===');
            console.log('Stato attuale:', showOnlyWithLocation);
            console.log('Nuovo stato:', !showOnlyWithLocation);
            setShowOnlyWithLocation(!showOnlyWithLocation);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] text-sm ${
            showOnlyWithLocation 
              ? 'bg-[hsl(142,70%,35%)] text-white shadow-3d' 
              : 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))/80] shadow-3d'
          } transition-all`}
        >
          <MapPin className="h-4 w-4" />
          {showOnlyWithLocation ? 'Mostra tutti i libri' : 'Mostra solo libri con posizione'}
        </button>

        {/* Debug info */}
        <div className="text-xs text-[hsl(var(--muted-foreground))]">
          Libri totali: {books.length} |
          Con location: {books.filter(b => b.location && b.location.trim() !== '').length} |
          Filtrati: {filteredBooks.length}
        </div>
      </div>

      {/* Lista libri */}
      <AnimatePresence mode="wait">
        <motion.div 
          className="book-list"
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {filteredBooks.map((book, index) => (
            <motion.div
              key={book.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.05, 
                type: "spring", 
                stiffness: 300, 
                damping: 25 
              }}
              className="book-card shadow-3d"
              whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
            >
              <Link href={`/books/${book.id}`} className="block h-full">
                <div className="bg-[hsl(var(--card))] rounded-[var(--radius)] overflow-hidden h-full flex flex-col relative">
                  {/* Copertina */}
                  <div className="relative w-full pt-[150%] overflow-hidden">
                    {book.coverUrl ? (
                      <Image
                        src={book.coverUrl}
                        alt={book.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500"
                        priority={index < 8}
                        quality={80}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[hsl(var(--muted))] flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-[hsl(var(--muted-foreground))]" />
                      </div>
                    )}
                    
                    {/* Overlay con informazioni */}
                    <div className="book-card-image-overlay">
                      <div className="book-card-image-overlay-content">
                        <h3 className="font-bold">{book.title}</h3>
                        {book.author && <p>{book.author}</p>}
                        
                        {/* Badge per lo stato */}
                        {book.status && (
                          <span className={`status-badge mt-2 ${statusColors[book.status]}`}>
                            {book.status}
                          </span>
                        )}
                        
                        {/* Posizione */}
                        {book.location && (
                          <div className="flex items-center gap-1 mt-2 text-xs">
                            <MapPin className="h-3 w-3" />
                            <span>{book.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Dettagli libro */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg line-clamp-2 mb-1">{book.title}</h3>
                    {book.author && (
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2 line-clamp-1">{book.author}</p>
                    )}
                    
                    {/* Metadati in fondo */}
                    <div className="mt-auto pt-2 flex flex-wrap gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                      {book.publishedDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{book.publishedDate}</span>
                        </div>
                      )}
                      
                      {book.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span>{book.rating}/5</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
