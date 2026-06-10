"use client";

import { useState } from "react";
import { Sun, Moon, Monitor, User, Bell, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const SECOES = [
  { id: "conta",        label: "Conta",        icon: User },
  { id: "aparencia",    label: "Aparência",    icon: Palette },
  { id: "notificacoes", label: "Notificações", icon: Bell },
] as const;

const TEMAS = [
  { id: "light",  label: "Claro",   icon: Sun },
  { id: "dark",   label: "Escuro",  icon: Moon },
  { id: "system", label: "Sistema", icon: Monitor },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  nomeUsuario?: string;
  emailUsuario?: string;
}

export function SettingsModal({ open, onOpenChange, nomeUsuario = "", emailUsuario = "" }: Props) {
  const { theme, setTheme } = useTheme();
  const [secao, setSecao] = useState<(typeof SECOES)[number]["id"]>("conta");
  const atual = SECOES.find((s) => s.id === secao)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <div className="flex h-[min(420px,calc(100dvh-4rem))]">
          {/* menu lateral */}
          <nav className="w-48 shrink-0 space-y-1 border-r bg-muted/30 p-2">
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground">Configurações</p>
            {SECOES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSecao(s.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  secao === s.id
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </button>
            ))}
          </nav>

          {/* conteúdo da seção */}
          <div className="flex-1 overflow-y-auto p-6">
            <DialogHeader className="mb-4 text-left">
              <DialogTitle>{atual.label}</DialogTitle>
              <DialogDescription>Ajustes de {atual.label.toLowerCase()} da sua conta.</DialogDescription>
            </DialogHeader>

            {secao === "conta" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" defaultValue={nomeUsuario} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" defaultValue={emailUsuario} />
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="n1">Resumo semanal por e-mail</Label>
                  <Switch id="n1" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
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
