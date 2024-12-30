/**
 * Configurazione delle variabili d'ambiente
 */
export const env = {
  googleBooksApiKey: process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY || '',
} as const;

/**
 * Verifica se una chiave API è disponibile
 */
export function hasGoogleBooksApiKey(): boolean {
  return Boolean(env.googleBooksApiKey);
}
