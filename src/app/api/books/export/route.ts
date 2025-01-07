import { NextRequest, NextResponse } from "next/server"
import { exportBooksToCsv } from "@/utils/bookCsvUtils"
import { join } from "path"
import { tmpdir } from "os"
import { readFile } from "fs/promises"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const tempPath = join(tmpdir(), `export-${Date.now()}.csv`)
    await exportBooksToCsv(tempPath)
    
    const fileContent = await readFile(tempPath)
    
    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="library-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Errore durante l'esportazione:", error)
    return NextResponse.json(
      { error: "Errore durante l'esportazione" },
      { status: 500 }
    )
  }
}
