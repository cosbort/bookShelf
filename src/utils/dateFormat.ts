/**
 * Formatta una data nel formato dd/mm/yyyy
 * @param date - La data da formattare (stringa o oggetto Date)
 * @returns La data formattata o una stringa vuota se la data non è valida
 */
export function formatDate(date: string | Date): string {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return typeof date === 'string' ? date : '';
    }
    
    return dateObj.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Errore nella formattazione della data:', error);
    return typeof date === 'string' ? date : '';
  }
}
