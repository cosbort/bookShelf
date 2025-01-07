"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Mostra il pulsante appena si inizia a scorrere (dopo 50px)
      setIsVisible(window.scrollY > 50)
    }

    // Aggiungi l'event listener
    window.addEventListener("scroll", toggleVisibility, { passive: true })
    // Controlla lo stato iniziale
    toggleVisibility()

    // Cleanup
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "fixed bottom-4 right-4 z-50 rounded-full transition-all duration-200 bg-background/80 backdrop-blur hover:bg-background",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
      )}
      onClick={scrollToTop}
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  )
}
