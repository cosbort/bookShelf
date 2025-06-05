import { NextResponse } from 'next/server';
import { getBookCoverUrlFromBook } from '@/utils/bookCsvUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || searchParams.get('query') || '';
  const author = searchParams.get('author') || undefined;
  const isbn = searchParams.get('isbn') || undefined;

  if (!title && !isbn) {
    return NextResponse.json(
      { error: 'Missing title or isbn parameter' },
      { status: 400 }
    );
  }

  try {
    const coverUrl = await getBookCoverUrlFromBook({ title, author, isbn });
    return NextResponse.json({ coverUrl });
  } catch (error) {
    console.error('Error fetching cover:', error);
    return NextResponse.json(
      { error: 'Error fetching cover' },
      { status: 500 }
    );
  }
}
