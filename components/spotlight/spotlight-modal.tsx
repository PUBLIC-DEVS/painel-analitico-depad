"use client"

import { useEffect, useRef, useState } from "react"
import { useSpotlight } from "./spotlight-context"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { SearchIcon, ArrowUpIcon, ArrowDownIcon, CornerDownLeftIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Sugestões de exemplo — substitua pela sua lógica real
const SUGGESTIONS = [
  { label: "Dashboard", href: "/dashboard", category: "Páginas" },
  { label: "Comunidades Terapêuticas", href: "/cts", category: "Páginas" },
  { label: "Relatórios", href: "/relatorios", category: "Páginas" },
  { label: "Configurações", href: "/configuracoes", category: "Páginas" },
  { label: "Exportar dados", href: "#", category: "Ações" },
  { label: "Novo registro", href: "#", category: "Ações" },
]

export function SpotlightModal() {
  const { open, setOpen } = useSpotlight()
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? SUGGESTIONS.filter((s) =>
        s.label.toLowerCase().includes(query.toLowerCase())
      )
    : SUGGESTIONS

  // Foca o input quando abre
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
        setQuery("")
        setActiveIndex(0)
      }, 50)
    }
  }, [open])

  // Navegação com teclado dentro do modal
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === "Enter" && filtered[activeIndex]) {
        e.preventDefault()
        window.location.href = filtered[activeIndex].href
        setOpen(false)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, filtered, activeIndex, setOpen])

  if (!open) return null

  const grouped = filtered.reduce<Record<string, typeof SUGGESTIONS>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    },
    {}
  )

  return (
    // Backdrop
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) setOpen(false)
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
    >
      {/* Painel */}
      <div
        className="w-full max-w-lg mx-4 rounded-xl border border-border bg-background shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Busca rápida"
      >
        {/* Input */}
        <div className="border-b border-border px-3 py-2">
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              placeholder="Buscar páginas, ações..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent"
            />
            <InputGroupAddon align="inline-end">
              <Kbd>Esc</Kbd>
            </InputGroupAddon>
          </InputGroup>
        </div>

        {/* Resultados */}
        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum resultado para &ldquo;{query}&rdquo;
            </p>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {category}
                </p>
                {items.map((item) => {
                  const globalIndex = filtered.indexOf(item)
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setActiveIndex(globalIndex)}
                      className={cn(
                        "flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                        activeIndex === globalIndex
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent/50"
                      )}
                    >
                      <SearchIcon className="size-3.5 text-muted-foreground shrink-0" />
                      {item.label}
                    </a>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer com atalhos */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Kbd><ArrowUpIcon className="size-3" /></Kbd>
            <Kbd><ArrowDownIcon className="size-3" /></Kbd>
            navegar
          </span>
          <span className="flex items-center gap-1">
            <Kbd><CornerDownLeftIcon className="size-3" /></Kbd>
            abrir
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd>
            fechar
          </span>
        </div>
      </div>
    </div>
  )
}
