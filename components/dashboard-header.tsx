"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState, useRef, useEffect, useCallback } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { SearchIcon, LoaderCircleIcon, AlertCircleIcon, BuildingIcon } from "lucide-react"
import type { Comunidade } from "@/app/api/dashboard/contratos/_types"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function isCnpjDigits(value: string) {
  return /^\d{14}$/.test(value.replace(/\D/g, "")) && /^\d+$/.test(value.trim())
}

function highlight(text: string, query: string) {
  if (!query.trim()) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-primary rounded-xs font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardHeader() {
  const pathname = usePathname()
  const router   = useRouter()
  const segments = pathname.split("/").filter(Boolean)

  const [query,       setQuery]       = useState("")
  const [suggestions, setSuggestions] = useState<Comunidade[]>([])
  const [loading,     setLoading]     = useState(false)
  const [open,        setOpen]        = useState(false)   // dropdown
  const [error,       setError]       = useState<string | null>(null)

  // cache de todas as comunidades após a primeira busca
  const cacheRef     = useRef<Comunidade[] | null>(null)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef   = useRef<HTMLDivElement>(null)

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  const fetchAndFilter = useCallback(async (value: string) => {
    if (!value.trim()) {
      setSuggestions([])
      setOpen(false)
      return
    }

    // Carrega o cache uma única vez
    if (!cacheRef.current) {
      setLoading(true)
      try {
        const res = await fetch("/api/dashboard/contratos?resource=comunidades")
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        cacheRef.current = await res.json() as Comunidade[]
      } catch {
        cacheRef.current = []
      } finally {
        setLoading(false)
      }
    }

    const all = cacheRef.current ?? []
    const q   = value.toLowerCase()

    const filtered = all
      .filter((c) =>
        c.nome_fantasia?.toLowerCase().includes(q) ||
        c.razao_social?.toLowerCase().includes(q)  ||
        c.cnpj.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
      )
      .slice(0, 7)

    setSuggestions(filtered)
    setOpen(filtered.length > 0)
  }, [])

  // Debounce: espera 220 ms após o último keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchAndFilter(query), 220)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchAndFilter])

  function navigate(cnpj: string) {
    const digits = cnpj.replace(/\D/g, "")
    setOpen(false)
    setQuery("")
    router.push(`/dashboard/comunidade/${digits}`)
  }

  function handleSelect(c: Comunidade) {
    navigate(c.cnpj)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    // Só aceita CNPJ puro em dígitos (14 dígitos)
    if (!isCnpjDigits(trimmed)) {
      setError(
        "A busca direta aceita apenas CNPJ (14 dígitos numéricos).\n" +
        "Para buscar por nome, selecione uma sugestão da lista."
      )
      return
    }

    const digits = trimmed.replace(/\D/g, "")
    const found  = cacheRef.current?.find(
      (c) => c.cnpj.replace(/\D/g, "") === digits
    )

    if (!found) {
      setError(`CNPJ ${trimmed} não encontrado na base de dados.`)
      return
    }

    navigate(found.cnpj)
  }

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {segments.flatMap((segment, index) => {
                const isLast = index === segments.length - 1
                const href   = "/" + segments.slice(0, index + 1).join("/")
                const item   = (
                  <BreadcrumbItem key={href}>
                    {!isLast ? (
                      <BreadcrumbLink href={href} className="hidden md:block">
                        {capitalize(segment)}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{capitalize(segment)}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                )
                if (isLast) return [item]
                return [
                  item,
                  <BreadcrumbSeparator key={`sep-${href}`} className="hidden md:block" />,
                ]
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Barra de pesquisa com autocomplete */}
        <form
          onSubmit={handleSubmit}
          className="ml-auto flex items-center gap-2"
        >
          <div className="relative" ref={wrapperRef}>
            {/* Input */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              {loading && (
                <LoaderCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin pointer-events-none" />
              )}
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
                placeholder="Nome ou CNPJ..."
                className="pl-9 pr-8 w-72"
                autoComplete="off"
              />
            </div>

            {/* Dropdown de sugestões */}
            {open && suggestions.length > 0 && (
              <ul
                role="listbox"
                className="absolute z-50 top-[calc(100%+4px)] left-0 w-full min-w-[320px] rounded-lg border bg-popover shadow-lg overflow-hidden"
              >
                {suggestions.map((c) => {
                  const displayName = c.nome_fantasia || c.razao_social
                  const subName     = c.nome_fantasia ? c.razao_social : null
                  return (
                    <li
                      key={`${c.cnpj}_${c.contrato_ano}`}
                      role="option"
                      aria-selected="false"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-accent transition-colors"
                      onPointerDown={(e) => {
                        e.preventDefault() // evita blur no input
                        handleSelect(c)
                      }}
                    >
                      <BuildingIcon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium leading-tight">
                          {highlight(displayName, query)}
                        </span>
                        {subName && (
                          <span className="truncate text-xs text-muted-foreground">
                            {subName}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground font-mono">
                          {c.cnpj} — {c.cidade}/{c.uf}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <Button type="submit" size="sm" disabled={loading}>
            {loading
              ? <LoaderCircleIcon className="size-4 animate-spin" />
              : "Buscar"
            }
          </Button>
        </form>
      </header>

      {/* Modal de erro */}
      <Dialog open={!!error} onOpenChange={() => setError(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircleIcon className="size-5" />
              Erro na busca
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line pt-1">
              {error}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setError(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}