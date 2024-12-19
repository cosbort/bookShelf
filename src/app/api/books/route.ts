import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const books = await prisma.book.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
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
  try {
    const data = await request.json();
    const book = await prisma.book.create({
      data: {
        title: data.title,
        author: data.author,
        genre: data.genre,
        status: data.status,
        isbn: data.isbn,
        coverUrl: data.coverUrl,
        description: data.description,
        publishedDate: data.publishedDate,
        publisher: data.publisher,
        pageCount: data.pageCount,
      },
    });
    return NextResponse.json(book);
  } catch (error) {
    console.error('Error creating book:', error);
    return NextResponse.json(
      { error: 'Error creating book' },
      { status: 500 }
    );
  }
}
