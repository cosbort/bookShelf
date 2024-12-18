import type { Book } from '@/types/book';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BookCardProps {
  book: Book;
  onClick?: (book: Book) => void;
}

export function BookCard({ book, onClick }: BookCardProps): JSX.Element {
  const { title, author, rating, readingStatus, coverImage } = book;

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick?.(book)}
    >
      <CardHeader>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <p className="text-gray-600">{author}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={`text-xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
              ★
            </span>
          ))}
        </div>
        <Badge variant={readingStatus === 'completato' ? 'success' : 'default'}>
          {readingStatus}
        </Badge>
        {coverImage && (
          <img 
            src={coverImage} 
            alt={`Copertina di ${title}`}
            className="w-full h-48 object-cover mt-4 rounded-md"
          />
        )}
      </CardContent>
    </Card>
  );
}
