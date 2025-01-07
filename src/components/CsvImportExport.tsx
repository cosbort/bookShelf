import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ImportProgress, ExportProgress } from '@/types/progress';
import { importBooksFromCsv, exportBooksToCsv } from '@/utils/bookCsvUtils';
import { useBooks } from '@/hooks/useBooks';

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
      
      toast.success(
        `Importazione completata: ${result.success} libri importati, ${result.errors} errori`
      );

      if (result.errors > 0) {
        console.error('Errori durante l\'importazione:', result.errorDetails);
      }
      
      onComplete?.();
    } catch (error) {
      toast.error(`Errore durante l'importazione: ${error.message}`);
    } finally {
      setImporting(false);
      setProgress(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportBooksToCsv((progress) => {
        setProgress(progress);
      });

      // Creare un link per il download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'books_export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Esportazione completata con successo');
      onComplete?.();
    } catch (error) {
      toast.error(`Errore durante l'esportazione: ${error.message}`);
    } finally {
      setExporting(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <Button
          variant="outline"
          onClick={() => document.getElementById('csvInput')?.click()}
          disabled={importing}
        >
          {importing ? 'Importazione in corso...' : 'Importa CSV'}
        </Button>
        <input
          id="csvInput"
          type="file"
          accept=".csv"
          onChange={handleImport}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Esportazione in corso...' : 'Esporta CSV'}
        </Button>
      </div>

      {progress && (
        <div className="space-y-2">
          <Progress value={
            progress.status !== 'error'
              ? (progress.currentBook / progress.totalBooks) * 100
              : undefined
          } />
          <p className="text-sm text-gray-500">
            {(progress.status === 'importing' || progress.status === 'exporting')
              ? `Elaborazione in corso... ${progress.currentBook} ${
                  progress.totalBooks > 0
                    ? `di ${progress.totalBooks}`
                    : ''
                }`
              : progress.status}
          </p>
        </div>
      )}
    </div>
  );
}
