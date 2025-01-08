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
  'To Read': 'bg-blue-500/20 text-blue-500 border-blue-500/50',
  'Reading': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
  'Read': 'bg-green-500/20 text-green-500 border-green-500/50',
  'Completed': 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50',
  'Dropped': 'bg-red-500/20 text-red-500 border-red-500/50',
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
        <div className="text-gray-400">Caricamento libri...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Errore nel caricamento dei libri</div>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Nessun libro trovato</div>
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per titolo, autore, ISBN o posizione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-700 bg-gray-800 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
            showOnlyWithLocation 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-700 text-white hover:bg-gray-600'
          } transition-colors`}
        >
          <MapPin className="h-4 w-4" />
          {showOnlyWithLocation ? 'Mostra tutti i libri' : 'Mostra solo libri con posizione'}
        </button>

        {/* Debug info */}
        <div className="text-xs text-gray-400">
          Libri totali: {books.length} |
          Con location: {books.filter(b => b.location && b.location.trim() !== '').length} |
          Filtrati: {filteredBooks.length}
        </div>
      </div>

      {/* Lista libri */}
      <AnimatePresence mode="wait">
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          layout
        >
          {filteredBooks.map((book) => (
            <motion.div
              key={book.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Link href={`/books/${book.id}`}>
                <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors h-full flex flex-col">
                  {/* Copertina e titolo */}
                  <div className="flex gap-4">
                    <div className="relative w-20 h-28 flex-shrink-0">
                      {book.coverUrl ? (
                        <Image
                          src={book.coverUrl}
                          alt={book.title}
                          fill
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white line-clamp-2">{book.title}</h3>
                      {book.author && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-1">{book.author}</p>
                      )}
                      {/* Status badge */}
                      <span 
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset mt-2",
                          statusColors[book.status]
                        )}
                      >
                        {book.status}
                      </span>
                    </div>
                  </div>

                  {/* Info aggiuntive */}
                  <div className="mt-4 space-y-2 text-sm">
                    {/* Location */}
                    {book.location && book.location.trim() !== '' && (
                      <div className="flex items-center gap-2 text-green-400">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="line-clamp-1">{book.location}</span>
                      </div>
                    )}

                    {/* Data inizio lettura */}
                    {book.dateStarted && (
                      <div className="flex items-center gap-2 text-blue-400">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>Iniziato: {formatDate(book.dateStarted)}</span>
                      </div>
                    )}

                    {/* Rating */}
                    {book.rating && (
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Star className="h-3 w-3 flex-shrink-0" />
                        <span>{book.rating}/5</span>
                      </div>
                    )}

                    {/* Pagine */}
                    {book.pageCount && (
                      <div className="flex items-center gap-2 text-purple-400">
                        <BookOpen className="h-3 w-3 flex-shrink-0" />
                        <span>{book.pageCount} pagine</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Messaggio nessun risultato */}
      {filteredBooks.length === 0 && (
        <motion.div 
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-gray-400">Nessun libro trovato</p>
        </motion.div>
      )}
    </motion.div>
  );
}
