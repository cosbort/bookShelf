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

export interface SearchBookResult {
  title: string;
  author: string;
  description?: string;
  publishedDate?: string;
  publisher?: string;
  pageCount?: number;
  isbn?: string;
  coverUrl?: string;
  genre?: string;
  imageLinks?: {
    thumbnail: string;
    smallThumbnail?: string;
  };
}
