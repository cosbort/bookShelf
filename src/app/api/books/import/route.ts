import { NextRequest, NextResponse } from "next/server"
import { importBooksFromCsv } from "@/utils/bookCsvUtils"
import { Readable } from "stream"
import { writeFile } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json(
        { error: "Nessun file fornito" },
        { status: 400 }
      )
    }

    // Create a temporary file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempPath = join(tmpdir(), `upload-${Date.now()}.csv`)
    await writeFile(tempPath, buffer)

    // Create a TransformStream for progress updates
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Start the import process
    try {
      const result = await importBooksFromCsv(tempPath, async (current, total) => {
        const progress = Math.round((current / total) * 100)
        try {
          await writer.write(
            new TextEncoder().encode(JSON.stringify({ progress }) + "\n")
          )
        } catch (error) {
          console.error("Errore nell'invio del progresso:", error)
        }
      });

      await writer.write(
        new TextEncoder().encode(
          JSON.stringify({ 
            success: result.success,
            errors: result.errors,
            errorDetails: result.errorDetails 
          }) + "\n"
        )
      );
      
      await writer.close();
      return new NextResponse(stream.readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (error) {
      console.error("Errore durante l'importazione:", error);
      await writer.close();
      return NextResponse.json(
        { error: "Errore durante l'importazione del file" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Errore durante l'importazione:", error)
    return NextResponse.json(
      { error: "Errore durante l'importazione" },
      { status: 500 }
    )
  }
}
