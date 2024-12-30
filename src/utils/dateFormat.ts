/**
 * Formatta una data nel formato dd/mm/yyyy
 * @param dateString - La data da formattare
 * @returns La data formattata o una stringa vuota se la data non è valida
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Errore nella formattazione della data:', error);
    return dateString;
  }
}
