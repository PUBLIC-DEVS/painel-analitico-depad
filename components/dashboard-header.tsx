
import { usePathname } from "next/navigation"
import { useState } from "react"
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
import { SearchIcon, LoaderCircleIcon } from "lucide-react"

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function DashboardHeader() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/comunidade?nome=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      console.log(data) // substitua pelo que quiser fazer com o resultado
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
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
              const href = "/" + segments.slice(0, index + 1).join("/")

              const item = (
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

      {/* Barra de pesquisa */}
      <form onSubmit={handleSearch} className="ml-auto flex items-center gap-2">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome..."
            className="pl-9 w-64"
          />
        </div>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            "Buscar"
          )}
        </Button>
      </form>
    </header>
  )
}