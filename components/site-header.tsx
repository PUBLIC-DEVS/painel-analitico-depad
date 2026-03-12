'use client'
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState, useRef } from "react"

interface HeaderProps {
  name: string;
}

const COMUNIDADES = [
  "React Developers",
  "Next.js Brasil",
  "TypeScript Community",
  "UI/UX Designers",
  "Node.js Enthusiasts",
  "Python Brasil",
  "DevOps & Cloud",
  "Open Source Contributors",
  "Frontend Masters",
  "Backend Builders",
]

export function SiteHeader(props: HeaderProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query.length > 0
    ? COMUNIDADES.filter(c => c.toLowerCase().includes(query.toLowerCase()))
    : []

  const handleSelect = (value: string) => {
    setQuery(value)
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-base font-medium">{props.name}</h1>
      </div>

      <div className="px-4 lg:px-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Pesquisar comunidades..."
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => query.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="pl-9 w-64 lg:w-80 h-9 bg-muted/40 border-muted-foreground/20 focus-visible:bg-background transition-all"
          />

          {open && filtered.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-popover border border-border rounded-md shadow-md z-50 overflow-hidden">
              {filtered.map((item) => (
                <button
                  key={item}
                  onMouseDown={() => handleSelect(item)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}