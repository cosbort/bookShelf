'use client';

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { useOpenLibrarySearch } from '@/hooks/useOpenLibrarySearch';
import { Book, ReadingStatus, SearchBookResult } from '@/types/book';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Book as BookIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface BookFormProps {
  onSubmit: (book: Omit<Book, 'id'>) => void;
  initialBook?: Book;
}

export function BookForm({ onSubmit, initialBook }: BookFormProps) {
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);
  const [searchResults, setSearchResults] = useState<SearchBookResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [apiInUse, setApiInUse] = useState<'google' | 'openlibrary'>('google');
  const [searchDisabled, setSearchDisabled] = useState(false);
  const [formData, setFormData] = useState<Omit<Book, 'id'>>({
    title: initialBook?.title || '',
    author: initialBook?.author || '',
    genre: initialBook?.genre || '',
    status: initialBook?.status || 'To Read',
    isbn: initialBook?.isbn || '',
    coverUrl: initialBook?.coverUrl || '',
    description: initialBook?.description || '',
    publishedDate: initialBook?.publishedDate || '',
    publisher: initialBook?.publisher || '',
    pageCount: initialBook?.pageCount || 0,
  });
  const [quotaError, setQuotaError] = useState(false);

  const { 
    searchByTitle: googleSearchByTitle, 
    searchByIsbn: googleSearchByIsbn, 
    isLoading: googleIsLoading, 
    error: googleError 
  } = useBookSearch();

  const { 
    searchByTitle: openLibrarySearchByTitle, 
    searchByIsbn: openLibrarySearchByIsbn, 
    isLoading: openLibraryIsLoading, 
    error: openLibraryError 
  } = useOpenLibrarySearch();

  const isLoading = googleIsLoading || openLibraryIsLoading;
  const errorState = apiInUse === 'google' ? googleError : openLibraryError;

  useEffect(() => {
    if (!debouncedSearchTerm.trim() || !isDropdownOpen || searchDisabled) {
      setSearchResults([]);
      return;
    }

    let isCurrentSearch = true;

    const search = async () => {
      try {
        const searchByTitle = apiInUse === 'google' ? googleSearchByTitle : openLibrarySearchByTitle;
        const searchByIsbn = apiInUse === 'google' ? googleSearchByIsbn : openLibrarySearchByIsbn;

        // Se il termine sembra un ISBN
        if (/^(\d{10}|\d{13})$/.test(debouncedSearchTerm.replace(/-/g, ''))) {
          const book = await searchByIsbn(debouncedSearchTerm.replace(/-/g, ''));
          if (book && isCurrentSearch) {
            setSearchResults([book]);
          }
          return;
        }

        // Altrimenti cerca per titolo
        if (debouncedSearchTerm.length >= 3) {
          const books = await searchByTitle(debouncedSearchTerm);
          if (isCurrentSearch && isDropdownOpen) {
            setSearchResults(books);
          }
        }
      } catch (error) {
        if (!isCurrentSearch) return;

        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          if (error.message === 'Request cancelled') {
            setError(null);
            return;
          }
          
          // Se Google Books ha raggiunto il limite, passa a OpenLibrary una sola volta
          if (apiInUse === 'google' && 
              (errorMessage.includes('quota') || 
               errorMessage.includes('rate_limit') || 
               error.message.includes('429'))) {
            setError('Passaggio a OpenLibrary come alternativa...');
            setApiInUse('openlibrary');
            return; // Non resettare i risultati qui
          }
          
          setError(error.message);
        }
      }
    };

    search();

    return () => {
      isCurrentSearch = false;
    };
  }, [debouncedSearchTerm, isDropdownOpen, searchDisabled, apiInUse]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!searchDisabled) {
      setSearchTerm(value);
      setIsDropdownOpen(value.trim().length >= 3);
    }
  };

  const handleSearchResultClick = (book: SearchBookResult) => {
    setFormData(prevData => ({
      ...prevData,
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      coverUrl: book.coverUrl || '',
      description: book.description || '',
      publishedDate: book.publishedDate || '',
      publisher: book.publisher || '',
      pageCount: book.pageCount || 0,
      genre: book.genre || prevData.genre || '', // Prima prova il genere del libro, poi quello precedente
      status: prevData.status || 'To Read'
    }));

    setIsDropdownOpen(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchDisabled ? "Ricerca temporaneamente non disponibile" : "Cerca un libro per titolo o ISBN..."}
              value={searchTerm}
              onChange={handleSearchInputChange}
              disabled={searchDisabled}
              className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 ${searchDisabled ? 'bg-gray-100' : ''}`}
            />
            {isLoading && (
              <div className="absolute right-3 top-3">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {(isDropdownOpen && searchTerm.trim()) && (
            <div 
              className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-auto"
              onMouseDown={(e) => {
                // Previene la chiusura del dropdown quando si clicca su di esso
                e.preventDefault();
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : errorState ? (
                <div className="p-4 text-sm text-red-500">{errorState}</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((book, index) => (
                  <button
                    key={book.isbn || index}
                    type="button"
                    onClick={() => handleSearchResultClick(book)}
                    className="w-full p-4 hover:bg-gray-50 flex gap-4 items-start border-b last:border-b-0 text-left"
                  >
                    {book.coverUrl ? (
                      <Image
                        src={book.coverUrl}
                        alt={`Copertina di ${book.title}`}
                        width={64}
                        height={96}
                        className="rounded shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/160x240?text=No+Cover';
                          target.classList.add('opacity-50');
                        }}
                      />
                    ) : (
                      <div className="w-16 h-24 bg-gray-100 rounded flex items-center justify-center shadow-sm">
                        <BookIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-medium">{book.title}</div>
                      <div className="text-sm text-gray-600">{book.author}</div>
                      {book.publishedDate && (
                        <div className="text-xs text-gray-500">
                          {book.publishedDate}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : searchTerm.trim() ? (
                <div className="p-4 text-sm text-gray-500">
                  Nessun risultato trovato
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Titolo
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700">
              Autore
            </label>
            <input
              id="author"
              name="author"
              type="text"
              value={formData.author}
              onChange={e => setFormData({ ...formData, author: e.target.value })}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label htmlFor="genre" className="block text-sm font-medium text-gray-700">
              Genere
            </label>
            <input
              id="genre"
              name="genre"
              type="text"
              value={formData.genre || ''}
              onChange={e => setFormData({ ...formData, genre: e.target.value })}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Opzionale"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Stato
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as ReadingStatus })}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="To Read">Da Leggere</option>
              <option value="Reading">In Lettura</option>
              <option value="Read">Letto</option>
            </select>
          </div>

          <div>
            <label htmlFor="isbn" className="block text-sm font-medium text-gray-700">
              ISBN
            </label>
            <input
              id="isbn"
              name="isbn"
              type="text"
              value={formData.isbn}
              onChange={e => setFormData({ ...formData, isbn: e.target.value })}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="coverUrl" className="block text-sm font-medium text-gray-700">
              URL Copertina
            </label>
            <input
              id="coverUrl"
              name="coverUrl"
              type="text"
              value={formData.coverUrl}
              onChange={e => setFormData({ ...formData, coverUrl: e.target.value })}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descrizione
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 flex h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="publishedDate" className="block text-sm font-medium text-gray-700">
              Data di Pubblicazione
            </label>
            <input
              id="publishedDate"
              name="publishedDate"
              type="text"
              value={formData.publishedDate}
              onChange={e => setFormData({ ...formData, publishedDate: e.target.value })}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="publisher" className="block text-sm font-medium text-gray-700">
              Editore
            </label>
            <input
              id="publisher"
              name="publisher"
              type="text"
              value={formData.publisher}
              onChange={e => setFormData({ ...formData, publisher: e.target.value })}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="pageCount" className="block text-sm font-medium text-gray-700">
              Numero di Pagine
            </label>
            <input
              id="pageCount"
              name="pageCount"
              type="number"
              value={formData.pageCount || ''}
              onChange={e => setFormData({ ...formData, pageCount: parseInt(e.target.value) || 0 })}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {/* Preview della copertina del libro selezionato */}
        {formData.coverUrl && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Copertina</p>
            <div className="relative w-32 h-48 bg-gray-50 rounded-lg overflow-hidden">
              <Image
                src={formData.coverUrl}
                alt={formData.title}
                width={64}
                height={96}
                className="rounded shadow-sm"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/320x480?text=No+Cover';
                  target.classList.add('opacity-50');
                }}
              />
            </div>
          </div>
        )}

        <button type="submit" className="w-full">
          {initialBook ? 'Aggiorna Libro' : 'Aggiungi Libro'}
        </button>
      </div>
    </form>
  );
}
