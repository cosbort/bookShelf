import { NextRequest, NextResponse } from "next/server"
import { parseCSVToBooks, convertBooksToCSV } from "@/utils/bookCsvUtils"

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

    const csvContent = await file.text()
    const result = await parseCSVToBooks(csvContent)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Errore durante il parsing del CSV:", error)
    return NextResponse.json(
      { error: "Errore durante il parsing del CSV" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const booksJson = searchParams.get("books")
    
    if (!booksJson) {
      return NextResponse.json(
        { error: "Nessun libro fornito" },
        { status: 400 }
      )
    }

    const books = JSON.parse(booksJson)
    const csvContent = await convertBooksToCSV(books)

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="library-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Errore durante la conversione in CSV:", error)
    return NextResponse.json(
      { error: "Errore durante la conversione in CSV" },
      { status: 500 }
    )
  }
}
