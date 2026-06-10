"use client";

import { useState } from "react";
import { Sun, Moon, Monitor, User, Bell, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const SECOES = [
  { id: "conta",        label: "Conta",        icon: User,    desc: "Seu perfil conectado." },
  { id: "aparencia",    label: "Aparência",    icon: Palette, desc: "Tema do painel." },
  { id: "notificacoes", label: "Notificações", icon: Bell,    desc: "Como você é avisado." },
] as const;

const TEMAS = [
  { id: "light",  label: "Claro",   icon: Sun },
  { id: "dark",   label: "Escuro",  icon: Moon },
  { id: "system", label: "Sistema", icon: Monitor },
];

const iniciais = (nome: string) => {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.at(-1)?.[0] ?? "")).toUpperCase() || "?";
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  nomeUsuario?: string;
  emailUsuario?: string;
  fotoUsuario?: string | null;
}

export function SettingsModal({ open, onOpenChange, nomeUsuario = "", emailUsuario = "", fotoUsuario }: Props) {
  const { theme, setTheme } = useTheme();
  const [secao, setSecao] = useState<(typeof SECOES)[number]["id"]>("conta");
  const atual = SECOES.find((s) => s.id === secao)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {/* mobile: menu vira linha no topo; desktop: coluna à esquerda */}
        <div className="flex max-h-[min(560px,calc(100dvh-2rem))] flex-col sm:flex-row sm:h-[420px]">
          <nav className="flex shrink-0 gap-1 border-b bg-muted/30 p-2 sm:w-48 sm:flex-col sm:border-b-0 sm:border-r">
            <p className="hidden px-3 py-2 text-xs font-medium text-muted-foreground sm:block">Configurações</p>
            {SECOES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSecao(s.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-colors sm:flex-none sm:justify-start",
                  secao === s.id
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <s.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-6">
            <DialogHeader className="mb-4 text-left">
              <DialogTitle>{atual.label}</DialogTitle>
              <DialogDescription>{atual.desc}</DialogDescription>
            </DialogHeader>

            {secao === "conta" && (
              <div className="flex flex-col items-center gap-3 rounded-xl border bg-muted/30 p-6 text-center">
                <Avatar className="h-16 w-16">
                  {fotoUsuario && <AvatarImage src={fotoUsuario} alt={nomeUsuario} />}
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                    {iniciais(nomeUsuario)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{nomeUsuario || "Visitante"}</div>
                  <div className="text-sm text-muted-foreground">{emailUsuario || "Não autenticado"}</div>
                </div>
              </div>
            )}

            {secao === "aparencia" && (
              <div className="space-y-2">
                <Label>Tema</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TEMAS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors",
                        theme === t.id ? "border-primary bg-accent" : "border-border hover:bg-muted",
                      )}
                    >
                      <t.icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {secao === "notificacoes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="n1">Resumo semanal por e-mail</Label>
                  <Switch id="n1" defaultChecked />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="n2">Alertas de novos contratos</Label>
                  <Switch id="n2" />
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
