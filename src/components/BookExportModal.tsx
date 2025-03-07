'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BookExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookExportModal({ isOpen, onClose }: BookExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/books/export', {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante l\'esportazione');
      }

      // Ottieni il blob dal response
      const blob = await response.blob();
      
      // Crea un URL per il blob
      const url = window.URL.createObjectURL(blob);
      
      // Crea un elemento <a> per il download
      const a = document.createElement('a');
      a.href = url;
      
      // Ottieni il nome del file dall'header o usa un nome predefinito
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'libri-esportati.csv';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Rimuovi l'elemento e rilascia l'URL
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      
      toast.success('Esportazione completata', {
        description: 'I tuoi libri sono stati esportati con successo'
      });
      
      // Chiudi il modal dopo 1.5 secondi
      setTimeout(() => {
        resetState();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Errore di esportazione:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Errore durante l\'esportazione');
      toast.error('Errore di esportazione', {
        description: error instanceof Error ? error.message : 'Si è verificato un errore durante l\'esportazione'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const resetState = () => {
    setIsExporting(false);
    setExportSuccess(false);
    setErrorMessage('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Esporta libri in CSV</DialogTitle>
          <DialogDescription>
            Esporta tutti i tuoi libri in un file CSV che potrai utilizzare in altri programmi o come backup
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-center flex-col p-6 border border-dashed border-[hsl(var(--border))] rounded-[var(--radius)] bg-[hsl(var(--accent))/5]">
            <Download className="h-16 w-16 text-[hsl(var(--primary))] mb-4" />
            <p className="text-center text-[hsl(var(--foreground))]">
              Il file CSV conterrà tutti i tuoi libri con i loro dettagli
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
              Titolo, autore, ISBN, posizione, stato e date di creazione e modifica
            </p>
          </div>
          
          {errorMessage && (
            <div className="flex items-center gap-2 text-[hsl(var(--destructive))] text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annulla
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || exportSuccess}
            className="shadow-glow"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Esportazione...
              </>
            ) : exportSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Esportato
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Esporta libri
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
