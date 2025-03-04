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

async function searchGoogleBooks(query: string): Promise<{ coverUrl: string | null; width: number; height: number } | null> {
  if (!hasGoogleBooksApiKey()) return null;

  try {
    const response = await fetchWithRetry(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${env.googleBooksApiKey}`
    );
    const data = await response.json();

    if (data.items?.[0]?.volumeInfo?.imageLinks) {
      const imageLinks = data.items[0].volumeInfo.imageLinks;
      // Preferisci l'immagine più grande disponibile
      const coverUrl = (imageLinks.large || imageLinks.medium || imageLinks.thumbnail || '').replace('http://', 'https://');
      
      // Dimensioni standard delle immagini di Google Books
      const dimensions = {
        large: { width: 512, height: 768 },
        medium: { width: 256, height: 384 },
        thumbnail: { width: 128, height: 192 }
      };

      let width = 128;
      let height = 192;

      if (imageLinks.large) {
        width = dimensions.large.width;
        height = dimensions.large.height;
      } else if (imageLinks.medium) {
        width = dimensions.medium.width;
        height = dimensions.medium.height;
      }

      return { coverUrl, width, height };
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
    const result = await searchGoogleBooks(query);

    return NextResponse.json({
      coverUrl: result?.coverUrl || null,
      width: result?.width || 128,
      height: result?.height || 192
    });
  } catch (error) {
    console.error('Errore durante il recupero della copertina:', error);
    return NextResponse.json(
      { error: 'Errore durante il recupero della copertina' },
      { status: 500 }
    );
  }
}
