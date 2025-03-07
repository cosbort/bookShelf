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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBooks } from '@/hooks/useBooks';

interface BookImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookImportModal({ isOpen, onClose }: BookImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { refetch } = useBooks();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setErrorMessage('');
    
    if (!selectedFile) {
      return;
    }
    
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setErrorMessage('Per favore seleziona un file CSV valido');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage('Per favore seleziona un file da importare');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/books/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante l\'importazione');
      }

      const data = await response.json();
      setUploadSuccess(true);
      
      // Aggiorna la lista dei libri
      await refetch();
      
      toast.success('Importazione completata', {
        description: `Importati ${data.importedCount} libri con successo`
      });
      
      // Chiudi il modal dopo 1.5 secondi
      setTimeout(() => {
        resetState();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Errore di importazione:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Errore durante l\'importazione');
      toast.error('Errore di importazione', {
        description: error instanceof Error ? error.message : 'Si è verificato un errore durante l\'importazione'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setIsUploading(false);
    setUploadSuccess(false);
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
          <DialogTitle>Importa libri da CSV</DialogTitle>
          <DialogDescription>
            Carica un file CSV con i tuoi libri per importarli nella tua libreria
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="file" className="font-medium">
              File CSV
            </Label>
            
            {file ? (
              <div className="flex items-center justify-between gap-2 p-2 border border-gray-300 rounded-lg bg-gray-100">
                <div className="flex items-center gap-2 truncate">
                  <div className="flex-shrink-0 p-1 rounded-full bg-blue-100">
                    <Check className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                <Button
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setFile(null)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <Label htmlFor="file" className="cursor-pointer text-center">
                  <span className="text-sm font-medium block mb-1">
                    Trascina qui il tuo file o clicca per selezionarlo
                  </span>
                  <span className="text-xs text-gray-400">
                    Supporta solo file CSV
                  </span>
                </Label>
              </div>
            )}
            
            {errorMessage && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-400">
            <p className="mb-1 font-medium">Il file CSV deve contenere le seguenti colonne:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>title - Titolo del libro</li>
              <li>author - Autore del libro</li>
              <li>isbn - ISBN del libro (opzionale)</li>
              <li>location - Posizione del libro (opzionale)</li>
              <li>status - Stato del libro (opzionale)</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annulla
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading || uploadSuccess}
            className="shadow-sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importazione...
              </>
            ) : uploadSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Importato
              </>
            ) : (
              'Importa'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
