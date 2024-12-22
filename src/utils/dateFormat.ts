/**
 * Formatta una data nel formato dd/mm/yyyy
 * @param dateString - La data da formattare
 * @returns La data formattata o una stringa vuota se la data non è valida
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '';
  
  try {
    // Gestisce diversi formati di input
    let date: Date;
    
    // Se la data è nel formato ISO (yyyy-mm-dd)
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } 
    // Se la data è nel formato yyyy-mm-dd
    else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      date = new Date(dateString);
    }
    // Altri formati
    else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}
