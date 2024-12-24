export type ReadingStatus = 'To Read' | 'Reading' | 'Read' | 'Completed' | 'Dropped';

export interface Book {
  id: string;
  isbn?: string;
  title: string;
  author: string;
  genre?: string; 
  status: ReadingStatus;
  coverUrl?: string;
  description?: string;
  publishedDate?: string;
  publisher?: string;
  pageCount?: number;
}

// Import SearchBookResult from search.ts instead of defining it here
import type { SearchBookResult } from './search';
