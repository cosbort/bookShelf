export type ReadingStatus = 'To Read' | 'Reading' | 'Read' | 'Completed' | 'Dropped';

export interface Book {
  id: string;
  isbn?: string;
  title: string;
  originalTitle?: string;
  subtitle?: string;
  author: string;
  authorLastFirst?: string;
  translator?: string;
  publisher?: string;
  genre?: string;
  status: ReadingStatus;
  coverUrl?: string;
  description?: string;
  publishedDate?: string;
  yearPublished?: number;
  language: string;
  pageCount?: number;
  rating?: number;
  location?: string;
  dateStarted?: Date;
  dateFinished?: Date;
  currentPage?: number;
  notes?: string;
  category?: string;
  wishList: boolean;
  previouslyOwned: boolean;
  upNext: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Import SearchBookResult from search.ts instead of defining it here
import type { SearchBookResult } from './search';
