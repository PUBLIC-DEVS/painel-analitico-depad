"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"

interface SpotlightContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const SpotlightContext = createContext<SpotlightContextValue | null>(null)

export function SpotlightProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => setOpen((prev) => !prev), [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K (Mac) or Ctrl+K (Windows/Linux)
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
      // Fechar com Escape
      if (e.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggle])

  return (
    <SpotlightContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </SpotlightContext.Provider>
  )
}

export function useSpotlight() {
  const ctx = useContext(SpotlightContext)
  if (!ctx) throw new Error("useSpotlight must be used within SpotlightProvider")
  return ctx
}
