import { Book } from './book';

export interface SearchBookResult {
  id?: string;
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
