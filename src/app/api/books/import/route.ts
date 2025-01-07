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

    // Start the import process in the background
    importBooksFromCsv(tempPath, writer)
      .catch(error => {
        console.error("Errore durante l'importazione:", error)
      })
      .finally(() => {
        writer.close().catch(() => {
          // Ignora gli errori di chiusura
        })
      })

    // Return the stream immediately
    return new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Errore durante l'importazione:", error)
    return NextResponse.json(
      { error: "Errore durante l'importazione" },
      { status: 500 }
    )
  }
}
