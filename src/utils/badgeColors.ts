/**
 * Restituisce i colori per il badge in base allo stato del libro
 */
export function getBadgeColors(status: string): { bg: string, text: string, border: string } {
  switch (status.toLowerCase()) {
    case 'read':
    case 'letto':
      return {
        bg: 'hsl(142, 76%, 95%)', // verde chiarissimo
        text: 'hsl(142, 72%, 29%)', // verde scuro
        border: 'hsl(142, 72%, 35%)'
      };
    case 'unread':
    case 'non letto':
      return {
        bg: 'hsl(0, 86%, 97%)', // rosso chiarissimo
        text: 'hsl(0, 74%, 39%)', // rosso scuro
        border: 'hsl(0, 74%, 45%)'
      };
    default:
      return {
        bg: 'hsl(213, 94%, 95%)', // blu chiarissimo
        text: 'hsl(213, 94%, 35%)', // blu scuro
        border: 'hsl(213, 94%, 45%)'
      };
  }
}
