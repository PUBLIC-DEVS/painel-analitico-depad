"use client";

/**
 * Calendário de eventos — grade do mês + agenda do dia selecionado.
 * Busca /api/calendario (Teams/Outlook via Graph, ou exemplos no dev). Sem libs
 * de data: a grade são 42 dias a partir do domingo da 1ª semana. Mobile-first —
 * a grade encolhe e a agenda fica embaixo.
 */

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Video, MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Evento } from "@/lib/calendario";

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const fmtMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const fmtHora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const fmtDia = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

const chave = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const mesmoDia = (a: Date, b: Date) => chave(a) === chave(b);

export default function Calendario() {
  const [eventos, setEventos] = useState<Evento[] | null>(null);
  const hoje = useMemo(() => new Date(), []);
  const [mes, setMes] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [selecionado, setSelecionado] = useState<Date>(hoje);

  useEffect(() => {
    fetch("/api/calendario").then((r) => r.json()).then(setEventos).catch(console.error);
  }, []);

  const porDia = useMemo(() => {
    const m = new Map<string, Evento[]>();
    for (const e of eventos ?? []) {
      if (!e.inicio) continue;
      const k = chave(new Date(e.inicio));
      const arr = m.get(k);
      if (arr) arr.push(e);
      else m.set(k, [e]);
    }
    return m;
  }, [eventos]);

  const dias = useMemo(() => {
    const inicio = new Date(mes);
    inicio.setDate(1 - inicio.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      return d;
    });
  }, [mes]);

  const eventosDoDia = porDia.get(chave(selecionado)) ?? [];
  const irMes = (delta: number) => setMes((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      {/* Grade do mês */}
      <Card className="p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold first-letter:uppercase sm:text-base">{fmtMes.format(mes)}</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => {
                setMes(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
                setSelecionado(new Date());
              }}
            >
              Hoje
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => irMes(-1)} aria-label="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => irMes(1)} aria-label="Próximo mês">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {SEMANA.map((d) => (
            <div key={d} className="pb-1 text-center text-[11px] font-medium text-muted-foreground">{d}</div>
          ))}
          {dias.map((d) => {
            const noMes = d.getMonth() === mes.getMonth();
            const qtd = (porDia.get(chave(d)) ?? []).length;
            const sel = mesmoDia(d, selecionado);
            const eHoje = mesmoDia(d, hoje);
            return (
              <button
                key={chave(d)}
                onClick={() => setSelecionado(new Date(d))}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md text-sm transition-colors",
                  sel ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  !noMes && !sel && "text-muted-foreground/40",
                  eHoje && !sel && "ring-1 ring-primary",
                )}
              >
                <span className={cn(eHoje && !sel && "font-semibold text-primary")}>{d.getDate()}</span>
                {qtd > 0 && <span className={cn("h-1 w-1 rounded-full", sel ? "bg-primary-foreground" : "bg-primary")} />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Agenda do dia */}
      <Card className="p-4">
        <div className="mb-3">
          <div className="text-sm font-semibold first-letter:uppercase">{fmtDia.format(selecionado)}</div>
          <div className="text-xs text-muted-foreground">
            {eventosDoDia.length} evento{eventosDoDia.length !== 1 ? "s" : ""}
          </div>
        </div>

        {eventos === null ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : eventosDoDia.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Nada agendado.</div>
        ) : (
          <div className="space-y-2">
            {eventosDoDia.map((e) => (
              <div key={e.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium leading-tight">{e.titulo}</span>
                  {e.online && (
                    <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]">
                      <Video className="h-3 w-3" />
                      Online
                    </Badge>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {fmtHora.format(new Date(e.inicio))}–{fmtHora.format(new Date(e.fim))}
                  </span>
                  {e.local && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {e.local}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
