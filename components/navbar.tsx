"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  LayoutDashboard, Map, FileText, Wallet, ChevronDown,
  BadgeCheck, Database, Info, Settings, LogOut, CalendarDays,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SettingsModal } from "@/components/settings-modal";
import { BuscaComunidades } from "@/components/busca-comunidades";
import { cn } from "@/lib/utils";

// Ordem: visão geral → setores (contratos/repasses/cebas) → base unificada por
// último → ferramentas (mapa/calendário).
const links = [
  { href: "/dashboard",           label: "Geral",                icon: LayoutDashboard },
  { href: "/dashboard/contratos", label: "Contratos",            icon: FileText },
  { href: "/dashboard/repasses",  label: "Repasses",             icon: Wallet },
  { href: "/dashboard/cebas",     label: "Cebas",                icon: BadgeCheck },
  { href: "/dashboard/base",      label: "Base de dados",        icon: Database },
  { href: "/dashboard/mapa",        label: "Mapa das comunidades", icon: Map },
  { href: "/dashboard/calendario",  label: "Meu calendário de eventos", icon: CalendarDays },
];

// Iniciais a partir do nome ("João Eduardo" → "JE"), pro fallback do avatar.
function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.at(-1)?.[0] ?? "")).toUpperCase() || "?";
}

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [configOpen, setConfigOpen] = useState(false);

  const nome = session?.user?.name ?? "Visitante";
  const email = session?.user?.email ?? "";

  // Foto de perfil via Graph (/api/me). Sem login, fica null → cai nas iniciais.
  const [foto, setFoto] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setFoto(d.foto))
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-13 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        {/* Logo DEPAD — azul no tema claro, branca no escuro */}
        <Link href="/dashboard" className="flex shrink-0 items-center" aria-label="DEPAD — Apoio e Acolhimento">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-depad.svg" alt="DEPAD" className="h-7 w-auto sm:h-8 dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-depad-branco.svg" alt="DEPAD" className="hidden h-7 w-auto sm:h-8 dark:block" />
        </Link>

        {/* Busca de comunidade — preenche o meio no mobile, largura fixa no desktop */}
        <div className="min-w-0 flex-1 sm:w-72 sm:flex-none lg:w-96">
          <BuscaComunidades />
        </div>

        {/* Perfil */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
            <Avatar className="h-7 w-7">
              {foto && <AvatarImage src={foto} alt={nome} />}
              <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">
                {iniciais(nome)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col text-left leading-tight sm:flex">
              <span className="text-xs font-medium">{nome}</span>
              {email && <span className="text-[11px] text-muted-foreground">{email}</span>}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Minha conta
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem className="gap-2 text-sm">
              <Info className="h-4 w-4 text-muted-foreground" />
              Sobre
            </DropdownMenuItem>

            <DropdownMenuItem className="gap-2 text-sm" onSelect={() => setConfigOpen(true)}>
              <Settings className="h-4 w-4 text-muted-foreground" />
              Configurações
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="gap-2 text-sm text-destructive focus:text-destructive"
              onSelect={() => signOut({ redirectTo: "/" })}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      {/* Links de navegação — rolam na horizontal no mobile (sem barra visível) */}
      <nav className="flex h-9 items-center gap-1 overflow-x-auto px-3 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-full shrink-0 items-center gap-1.5 border-b-[1.5px] px-2.5 text-xs transition-colors",
                active
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <SettingsModal
        open={configOpen}
        onOpenChange={setConfigOpen}
        nomeUsuario={nome}
        emailUsuario={email}
        fotoUsuario={foto}
      />
    </header>
  );
}
