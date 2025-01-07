import { NextResponse } from "next/server";
import { env, hasGoogleBooksApiKey } from "@/config/env";

const API_TIMEOUT = 5000; // 5 secondi
const MAX_RETRIES = 2;

async function fetchWithTimeout(url: string, options: { timeout?: number } = {}) {
  const { timeout = API_TIMEOUT } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  try {
    return await fetchWithTimeout(url);
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
}

async function searchGoogleBooks(query: string): Promise<string | null> {
  if (!hasGoogleBooksApiKey()) return null;

  try {
    const response = await fetchWithRetry(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${env.GOOGLE_BOOKS_API_KEY}`
    );
    const data = await response.json();

    if (data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
      // Sostituisci http con https per evitare errori di mixed content
      return data.items[0].volumeInfo.imageLinks.thumbnail.replace('http://', 'https://');
    }
  } catch (error) {
    console.error('Errore durante la ricerca su Google Books:', error);
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isbn = searchParams.get('isbn');
    const title = searchParams.get('title');
    const author = searchParams.get('author');

    if (!title) {
      return NextResponse.json(
        { error: 'Il titolo è obbligatorio' },
        { status: 400 }
      );
    }

    // Costruisci la query per Google Books
    let query = title;
    if (isbn) query = `isbn:${isbn}`;
    if (author) query += ` inauthor:${author}`;

    // Cerca la copertina su Google Books
    const coverUrl = await searchGoogleBooks(query);

    return NextResponse.json({ coverUrl });
  } catch (error) {
    console.error('Errore durante il recupero della copertina:', error);
    return NextResponse.json(
      { error: 'Errore durante il recupero della copertina' },
      { status: 500 }
    );
  }
}
