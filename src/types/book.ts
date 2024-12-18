export interface Book {
  id: string;
  title: string;
  author: string;
  rating: number;
  readingStatus: ReadingStatus;
  coverImage?: string;
  notes?: string;
}

export const ReadingStatus = {
  NOT_STARTED: 'non_iniziato',
  IN_PROGRESS: 'in_corso',
  COMPLETED: 'completato',
} as const;

export type ReadingStatus = typeof ReadingStatus[keyof typeof ReadingStatus];
