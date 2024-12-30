'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBooks } from '@/hooks/useBooks';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Library,
  Book as BookIcon,
  Bookmark as BookmarkIcon,
  Building as BuildingLibraryIcon
} from 'lucide-react';
import { formatDate } from '@/utils/dateFormat';
import { BookList } from "@/components/BookList";

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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">I miei libri</h2>
        <Link href="/books/new">
          <Button className="button-hover bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi libro
          </Button>
        </Link>
      </div>
      
      <div className="rounded-lg">
        <BookList />
      </div>
    </div>
  );
}
