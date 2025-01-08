import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ImportProgress, ExportProgress } from '@/types/progress';
import { importBooksFromCsv, exportBooksToCsv } from '@/utils/bookCsvUtils';
import { useBooks } from '@/hooks/useBooks';
import { Download, Upload } from 'lucide-react';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

interface CsvImportExportProps {
  onComplete?: () => void;
}

export function CsvImportExport({ onComplete }: CsvImportExportProps) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | ExportProgress | null>(null);
  const { mutate } = useBooks();

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const result = await importBooksFromCsv(file, (progress) => {
        setProgress(progress);
      });

      await mutate();
      
      if (result.errors > 0) {
        toast.error(`Importazione completata con errori: ${result.errors} errori su ${result.success + result.errors} libri`);
        console.error('Dettagli errori:', result.errorDetails);
        
        // Mostra i primi 3 errori in un toast separato
        if (result.errorDetails?.length > 0) {
          toast.error(
            result.errorDetails.slice(0, 3).join('\n') + 
            (result.errorDetails.length > 3 ? `\n...e altri ${result.errorDetails.length - 3} errori` : '')
          );
        }
      } else {
        toast.success(`Importazione completata: ${result.success} libri importati con successo`);
      }
      
      onComplete?.();
    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      toast.error(`Errore durante l'importazione: ${error.message}`);
    } finally {
      setImporting(false);
      setProgress(null);
      // Reset input value per permettere di importare lo stesso file
      event.target.value = '';
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportBooksToCsv((progress) => {
        setProgress(progress);
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `books_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Esportazione completata con successo');
      onComplete?.();
    } catch (error) {
      console.error('Errore durante l\'esportazione:', error);
      toast.error(`Errore durante l'esportazione: ${error.message}`);
    } finally {
      setExporting(false);
      setProgress(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative inline-block">
        <input
          id="csvInput"
          type="file"
          accept=".csv"
          onChange={handleImport}
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-10"
          disabled={importing || exporting}
        />
        <Button
          variant="outline"
          className="w-full sm:w-auto button-hover"
          disabled={importing || exporting}
        >
          <Upload className="mr-2 h-4 w-4" />
          {importing ? 'Importazione...' : 'Importa CSV'}
        </Button>
      </div>

      <Button
        variant="outline"
        className="w-full sm:w-auto button-hover"
        onClick={handleExport}
        disabled={importing || exporting}
      >
        <Download className="mr-2 h-4 w-4" />
        {exporting ? 'Esportazione...' : 'Esporta CSV'}
      </Button>

      {progress && (
        <div className="flex w-full items-center gap-2">
          <Progress value={progress.percentage} className="w-full" />
          <span className="text-sm text-muted-foreground">
            {progress.percentage}%
          </span>
        </div>
      )}

      <LoadingOverlay
        isLoading={exporting && !progress}
        text="Esportazione in corso..."
      />
    </div>
  );
}
