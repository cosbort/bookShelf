import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('=== GET /api/books - INIZIO ===');
  try {
    // Prima conta tutti i libri
    const totalCount = await prisma.book.count();
    console.log('Totale libri nel database:', totalCount);

    // Conta i libri con location
    const locationCount = await prisma.book.count({
      where: {
        location: {
          not: null,
          not: '',
        },
      },
    });
    console.log('Libri con location nel database:', locationCount);

    // Prendi tutti i libri
    const books = await prisma.book.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Log dettagliato dei libri con location
    const booksWithLocation = books.filter(b => b.location && b.location.trim() !== '');
    console.log('=== DETTAGLI LIBRI CON LOCATION ===');
    booksWithLocation.forEach(book => {
      console.log(`Libro: "${book.title}" - Location: "${book.location}"`);
    });

    // Log dei primi 5 libri senza location
    const booksWithoutLocation = books.filter(b => !b.location || b.location.trim() === '').slice(0, 5);
    console.log('=== ESEMPIO LIBRI SENZA LOCATION ===');
    booksWithoutLocation.forEach(book => {
      console.log(`Libro: "${book.title}" - Location: "${book.location}"`);
    });

    // Cerca specificamente libri con "Sez. 3"
    const sez3Books = books.filter(b => b.location?.toLowerCase().includes('sez. 3'));
    console.log('=== LIBRI CON "Sez. 3" ===');
    console.log('Trovati:', sez3Books.length);
    sez3Books.forEach(book => {
      console.log(`Libro: "${book.title}" - Location: "${book.location}"`);
    });

    console.log('=== GET /api/books - FINE ===');
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
        location: data.location || '',
        wishList: data.wishList || false,
        previouslyOwned: data.previouslyOwned || false,
        upNext: data.upNext || false,
        language: data.language || 'it',
        notes: data.notes || '',
        rating: data.rating ? parseFloat(data.rating) : null,
        dateStarted: data.dateStarted ? new Date(data.dateStarted) : null,
        dateFinished: data.dateFinished ? new Date(data.dateFinished) : null,
        currentPage: data.currentPage ? parseInt(data.currentPage) : null,
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
