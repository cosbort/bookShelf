import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    await prisma.book.deleteMany()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Errore durante la pulizia del database:", error)
    return NextResponse.json(
      { error: "Errore durante la pulizia del database" },
      { status: 500 }
    )
  }
}
