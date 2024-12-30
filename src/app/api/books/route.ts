import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('GET /api/books - Inizio richiesta');
  try {
    const books = await prisma.book.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
    console.log('GET /api/books - Libri trovati:', books.length);
    return NextResponse.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: 'Error fetching books' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log('POST /api/books - Inizio richiesta');
  try {
    const data = await request.json();
    console.log('POST /api/books - Dati ricevuti:', data);
    const book = await prisma.book.create({
      data: {
        title: data.title,
        author: data.author,
        genre: data.genre,
        status: data.status,
        isbn: data.isbn || '',
        coverUrl: data.coverUrl,
        description: data.description,
        publishedDate: data.publishedDate,
        publisher: data.publisher,
        pageCount: data.pageCount ? parseInt(data.pageCount) : null,
      },
    });
    console.log('POST /api/books - Libro creato:', book);
    return NextResponse.json(book);
  } catch (error) {
    console.error('Error creating book:', error);
    return NextResponse.json(
      { error: 'Error creating book' },
      { status: 500 }
    );
  }
}
