import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const book = await prisma.book.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { error: 'Error fetching book' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const data = await request.json();
    const book = await prisma.book.update({
      where: {
        id: params.id,
      },
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
    console.error('Error updating book:', error);
    return NextResponse.json(
      { error: 'Error updating book' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await prisma.book.delete({
      where: {
        id: params.id,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { error: 'Error deleting book' },
      { status: 500 }
    );
  }
}
