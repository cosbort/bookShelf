"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { Download, Upload } from "lucide-react"

interface ImportExportProps {
  onImport?: () => void
  onExport?: () => void
}

export function LibraryImportExport({ onImport, onExport }: ImportExportProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/books/import", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Errore durante l'importazione")
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("Impossibile leggere la risposta")

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = new TextDecoder().decode(value)
        const lines = text.split("\n").filter(Boolean)
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            
            if (data.progress !== undefined) {
              setProgress(data.progress)
            } else if (data.success !== undefined) {
              toast({
                title: "Importazione completata",
                description: `Importati ${data.success} libri con ${data.errors} errori`,
              })
              if (data.errorDetails?.length > 0) {
                console.error("Dettagli errori:", data.errorDetails)
              }
              if (onImport) onImport()
            }
          } catch (e) {
            console.error("Errore nel parsing della risposta:", e)
          }
        }
      }

    } catch (error) {
      console.error("Errore durante l'importazione:", error)
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante l'importazione",
      })
    } finally {
      setIsImporting(false)
      setProgress(0)
      // Reset input value to allow importing the same file again
      event.target.value = ""
    }
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const response = await fetch("/api/books/export", {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Errore durante l'esportazione")
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition")
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : "library.csv"

      // Create a blob from the response
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Esportazione completata",
        description: "I libri sono stati esportati con successo",
      })

      onExport?.()
    } catch (error) {
      console.error("Errore durante l'esportazione:", error)
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante l'esportazione",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative">
        <input
          type="file"
          accept=".csv"
          onChange={handleImport}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={isImporting || isExporting}
        />
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          disabled={isImporting || isExporting}
        >
          <Upload className="mr-2 h-4 w-4" />
          Importa CSV
        </Button>
      </div>

      <Button
        variant="outline"
        className="w-full sm:w-auto"
        onClick={handleExport}
        disabled={isImporting || isExporting}
      >
        <Download className="mr-2 h-4 w-4" />
        Esporta CSV
      </Button>

      {isImporting && (
        <div className="flex w-full items-center gap-2">
          <Progress value={progress} className="w-full" />
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>
      )}

      <LoadingOverlay
        isLoading={isExporting}
        text="Esportazione in corso..."
      />
    </div>
  )
}
