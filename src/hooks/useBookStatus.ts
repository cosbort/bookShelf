/**
 * Hook per gestire i colori degli stati dei libri
 */
export function useBookStatus() {
  // Mappa dei colori per ogni stato possibile del libro
  const statusColors = {
    'Letto': 'hsl(var(--primary))',
    'In lettura': 'hsl(var(--accent))',
    'Da leggere': 'hsl(var(--accent))',
    'Abbandonato': 'hsl(var(--destructive))',
    'Prestato': 'hsl(var(--secondary))',
    'Desiderato': 'hsl(var(--secondary))',
    // Default per stati non mappati
    'default': 'hsl(var(--muted-foreground))'
  };

  /**
   * Ritorna il colore corrispondente allo stato
   */
  const getStatusColor = (status: string): string => {
    if (!status) return statusColors.default;
    return statusColors[status] || statusColors.default;
  };

  /**
   * Ritorna l'icona corrispondente allo stato
   */
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'Letto':
        return 'eye';
      case 'In lettura':
        return 'bookmark';
      case 'Da leggere':
        return 'star';
      case 'Abbandonato':
        return 'x';
      case 'Prestato':
        return 'share';
      case 'Desiderato':
        return 'heart';
      default:
        return 'circle';
    }
  };

  return {
    getStatusColor,
    getStatusIcon,
    statuses: Object.keys(statusColors).filter(status => status !== 'default'),
  };
}
