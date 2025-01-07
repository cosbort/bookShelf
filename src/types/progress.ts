export interface ImportProgress {
  currentBook: number;
  totalBooks: number;
  currentCover: number;
  totalCovers: number;
  status: 'importing' | 'loading-covers' | 'completed' | 'error';
  message?: string;
}

export interface ExportProgress {
  currentBook: number;
  totalBooks: number;
  status: 'exporting' | 'completed' | 'error';
  message?: string;
}
