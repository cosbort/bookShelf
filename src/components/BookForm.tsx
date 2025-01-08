'use client';

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useOpenLibrarySearch } from '@/hooks/useOpenLibrarySearch';
import { Book } from '@/types/book';
import { ReadingStatus } from '@/types/book';
import { SearchBookResult } from '@/types/search';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Book as BookIcon, Loader2, MapPin } from 'lucide-react';
import Image from 'next/image';
import { formatDate } from '@/utils/dateFormat';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookFormProps {
  onSubmit: (book: Omit<Book, 'id'>) => void;
  initialBook?: Book;
}

const CoverPreview = ({ url }: { url: string }) => (
  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg">
    <Image
      src={url}
      alt="Copertina libro"
      fill
      className="object-cover"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "https://via.placeholder.com/300x450?text=No+Cover";
      }}
    />
  </div>
);

export function BookForm({ onSubmit, initialBook }: BookFormProps) {
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);
  const [searchResults, setSearchResults] = useState<SearchBookResult[]>([]);
  const [selectedBook, setSelectedBook] = useState<SearchBookResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    publishedDate: initialBook?.publishedDate ? new Date(initialBook.publishedDate).toISOString().split('T')[0] : '',
    publisher: initialBook?.publisher || '',
    pageCount: initialBook?.pageCount || 0,
    language: initialBook?.language || 'it',
    location: initialBook?.location || '',
    wishList: initialBook?.wishList || false,
    previouslyOwned: initialBook?.previouslyOwned || false,
    upNext: initialBook?.upNext || false,
    createdAt: initialBook?.createdAt || new Date(),
    updatedAt: initialBook?.updatedAt || new Date()
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

  const errorState = apiInUse === 'google' ? googleError : openLibraryError;

  useEffect(() => {
    if (!debouncedSearchTerm.trim() || !isDropdownOpen || searchDisabled) {
      setSearchResults([]);
      return;
    }

    let isCurrentSearch = true;

    const search = async () => {
      try {
        setError(null);
        setIsLoading(true);
        setSearchResults([]);

        if (!debouncedSearchTerm.trim()) {
          setIsDropdownOpen(false);
          return;
        }

        console.log('Iniziando la ricerca per:', debouncedSearchTerm);
        const searchByTitle = apiInUse === 'google' ? googleSearchByTitle : openLibrarySearchByTitle;
        const searchByIsbn = apiInUse === 'google' ? googleSearchByIsbn : openLibrarySearchByIsbn;

        if (/^(\d{10}|\d{13})$/.test(debouncedSearchTerm.replace(/-/g, ''))) {
          const book = await searchByIsbn(debouncedSearchTerm.replace(/-/g, ''));
          if (book && isCurrentSearch) {
            const searchResult: SearchBookResult = {
              title: book.title || 'Titolo sconosciuto',
              author: book.author || 'Autore sconosciuto',
              description: book.description,
              publishedDate: book.publishedDate,
              publisher: book.publisher,
              pageCount: book.pageCount,
              isbn: book.isbn,
              coverUrl: book.coverUrl,
              genre: book.genre
            };
            setSearchResults([searchResult]);
          }
          return;
        }

        if (debouncedSearchTerm.length >= 3) {
          const books = await searchByTitle(debouncedSearchTerm);
          if (isCurrentSearch && isDropdownOpen) {
            setSearchResults(books);
          }
        }
      } catch (err) {
        console.error('Errore durante la ricerca:', err);
        setError(err instanceof Error ? err.message : 'Si è verificato un errore durante la ricerca.');
        toast.error('Errore durante la ricerca', {
          description: err instanceof Error ? err.message : 'Si è verificato un errore durante la ricerca.'
        });
      } finally {
        setIsLoading(false);
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
      genre: book.genre || prevData.genre || '',
      status: prevData.status || 'To Read'
    }));

    setIsDropdownOpen(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      updatedAt: new Date()
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Barra di ricerca */}
      <Card>
        <CardHeader>
          <CardTitle>Ricerca Libro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Cerca un libro per titolo o ISBN..."
              value={searchTerm}
              onChange={handleSearchInputChange}
              className="pl-10"
            />
          </div>

          {isDropdownOpen && searchResults.length > 0 && (
            <div className="rounded-lg border bg-white/5 p-4 shadow-lg">
              <div className="space-y-4">
                {searchResults.map((book) => (
                  <button
                    key={book.isbn || book.title}
                    type="button"
                    className="flex w-full items-start gap-4 rounded-lg p-2 text-left transition-colors hover:bg-white/10"
                    onClick={() => handleSearchResultClick(book)}
                  >
                    {book.coverUrl && (
                      <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded">
                        <Image
                          src={book.coverUrl}
                          alt={book.title}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://via.placeholder.com/300x450?text=No+Cover";
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{book.title}</h3>
                      <p className="text-sm text-gray-400">{book.author}</p>
                      {book.publisher && (
                        <p className="mt-1 text-xs text-gray-500">
                          {book.publisher}
                          {book.publishedDate &&
                            ` - ${new Date(book.publishedDate).getFullYear()}`}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Copertina */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Copertina</CardTitle>
          </CardHeader>
          <CardContent>
            {formData.coverUrl ? (
              <CoverPreview url={formData.coverUrl} />
            ) : (
              <div className="aspect-[2/3] bg-muted rounded-lg flex items-center justify-center">
                <BookIcon className="h-20 w-20 text-muted-foreground" />
              </div>
            )}
            <Input
              type="url"
              name="coverUrl"
              value={formData.coverUrl}
              onChange={handleInputChange}
              placeholder="URL Copertina"
              className="mt-4"
            />
          </CardContent>
        </Card>

        {/* Informazioni principali */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informazioni Principali</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Titolo
                </label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Autore
                </label>
                <Input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Genere
                </label>
                <Input
                  type="text"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Stato
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange({ target: { name: "status", value } } as React.ChangeEvent<HTMLInputElement>)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona lo stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Read">Da leggere</SelectItem>
                    <SelectItem value="Reading">In lettura</SelectItem>
                    <SelectItem value="Read">Letto</SelectItem>
                    <SelectItem value="Completed">Completato</SelectItem>
                    <SelectItem value="Dropped">Abbandonato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  ISBN
                </label>
                <Input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Posizione
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Es: Scaffale 3, Piano 2"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dettagli aggiuntivi */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Dettagli Aggiuntivi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Data di Pubblicazione
                </label>
                <Input
                  type="date"
                  name="publishedDate"
                  value={formData.publishedDate}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Editore
                </label>
                <Input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Numero di Pagine
                </label>
                <Input
                  type="number"
                  name="pageCount"
                  value={formData.pageCount || ''}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Descrizione
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="submit" size="lg">
          Salva Libro
        </Button>
      </div>
    </form>
  );
}
