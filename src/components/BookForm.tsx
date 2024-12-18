import * as React from "react";
import { useState } from 'react';
import type { Book } from '@/types/book';
import { ReadingStatus } from '@/types/book';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BookFormProps {
  initialData?: Partial<Book>;
  onSubmit: (bookData: Omit<Book, 'id'>) => Promise<void>;
}

export function BookForm({ initialData, onSubmit }: BookFormProps): JSX.Element {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    author: initialData?.author || '',
    rating: initialData?.rating || 0,
    readingStatus: initialData?.readingStatus || ReadingStatus.NOT_STARTED,
    notes: initialData?.notes || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Titolo
        </label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <label htmlFor="author" className="block text-sm font-medium">
          Autore
        </label>
        <Input
          id="author"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          required
        />
      </div>

      <div>
        <label htmlFor="rating" className="block text-sm font-medium">
          Valutazione
        </label>
        <Select
          value={String(formData.rating)}
          onValueChange={(value) => setFormData({ ...formData, rating: Number(value) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleziona una valutazione" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((rating) => (
              <SelectItem key={rating} value={String(rating)}>
                {'★'.repeat(rating)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium">
          Stato Lettura
        </label>
        <Select
          value={formData.readingStatus}
          onValueChange={(value) => setFormData({ ...formData, readingStatus: value as ReadingStatus })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleziona lo stato" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(ReadingStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Note
        </label>
        <textarea
          id="notes"
          className="w-full p-2 border rounded-md"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Salvataggio...' : 'Salva'}
      </Button>
    </form>
  );
}
