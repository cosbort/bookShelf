import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('=== DEBUG API - INIZIO ===');
  try {
    // Conta tutti i libri
    const totalBooks = await prisma.book.count();
    console.log('Totale libri:', totalBooks);

    // Conta i libri con location
    const booksWithLocation = await prisma.book.count({
      where: {
        location: {
          not: null,
          not: '',
        },
      },
    });
    console.log('Libri con location:', booksWithLocation);

    // Prendi 5 libri con location
    const sampleBooksWithLocation = await prisma.book.findMany({
      where: {
        location: {
          not: null,
          not: '',
        },
      },
      select: {
        id: true,
        title: true,
        location: true,
      },
      take: 5,
    });
    console.log('Esempio libri con location:', sampleBooksWithLocation);

    // Prendi 5 libri senza location
    const sampleBooksWithoutLocation = await prisma.book.findMany({
      where: {
        OR: [
          { location: null },
          { location: '' },
        ],
      },
      select: {
        id: true,
        title: true,
        location: true,
      },
      take: 5,
    });
    console.log('Esempio libri senza location:', sampleBooksWithoutLocation);

    // Cerca libri con "Sez. 3" nella location
    const booksWithSez3 = await prisma.book.findMany({
      where: {
        location: {
          contains: 'Sez. 3',
        },
      },
      select: {
        id: true,
        title: true,
        location: true,
      },
    });
    console.log('Libri con "Sez. 3" nella location:', booksWithSez3);

    console.log('=== DEBUG API - FINE ===');

    return NextResponse.json({
      totalBooks,
      booksWithLocation,
      sampleBooksWithLocation,
      sampleBooksWithoutLocation,
      booksWithSez3,
    });
  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json(
      { error: 'Error in debug API' },
      { status: 500 }
    );
  }
}
