"use client";

/**
 * Base de dados — visão UNIFICADA de todas as comunidades (a "master").
 *
 * Cruza contratadas + repasses (termo de fomento) deduplicados por CNPJ, gerada
 * por scripts/build-master.py. Cada comunidade é Contratada, Repasse ou Ambos —
 * é o que sustenta o split "contratada vs geral": os KPIs mostram o total geral
 * e o recorte contratado lado a lado. Filtra por tipo, UF e busca, em memória.
 */

import { useEffect, useMemo, useState } from "react";
import { Search, Building2, FileSignature, Landmark, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fBRL } from "@/lib/formatters";
import { fetchDashboard } from "@/lib/dashboard-cache";
import type { ComunidadeUnificada } from "@/lib/dashboard-data";

const TODOS = "all";
const TIPOS = ["Contratada", "Repasse", "Ambos"] as const;

const CORES_TIPO: Record<string, string> = {
  Contratada: "border-transparent bg-primary/15 text-primary",
  Repasse: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Ambos: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export default function BaseUnificada() {
  const [dados, setDados] = useState<ComunidadeUnificada[] | null>(null);
  const [tipo, setTipo] = useState(TODOS);
  const [uf, setUf] = useState(TODOS);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    fetchDashboard<ComunidadeUnificada[]>("unificada").then(setDados).catch(console.error);
  }, []);

  const ufs = useMemo(
    () => (dados ? [...new Set(dados.map((r) => r.uf).filter(Boolean))].sort() : []),
    [dados],
  );

  // KPIs sobre TODAS as comunidades (independente do filtro): é o panorama geral.
  const panorama = useMemo(() => {
    const rows = dados ?? [];
    return {
      total: rows.length,
      contratadas: rows.filter((r) => r.tem_contrato).length,
      comRepasse: rows.filter((r) => r.tem_repasse).length,
      ambos: rows.filter((r) => r.tipo === "Ambos").length,
      vagas: rows.reduce((s, r) => s + r.vagas_contratadas, 0),
      repasse: rows.reduce((s, r) => s + r.valor_repasse_total, 0),
    };
  }, [dados]);

  const filtrados = useMemo(() => {
    if (!dados) return [];
    const q = busca.toLowerCase().trim();
    return dados.filter(
      (r) =>
        (tipo === TODOS || r.tipo === tipo) &&
        (uf === TODOS || r.uf === uf) &&
        (!q || r.nome.toLowerCase().includes(q) || r.cnpj.includes(busca) || r.cidade.toLowerCase().includes(q)),
    );
  }, [dados, tipo, uf, busca]);

  if (!dados) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs do panorama geral — total vs contratadas vs repasse */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard icone={Layers} rotulo="Comunidades (geral)" valor={panorama.total.toLocaleString("pt-BR")} sub="todas, sem duplicar CNPJ" />
        <KpiCard
          icone={Building2}
          rotulo="Contratadas"
          valor={panorama.contratadas.toLocaleString("pt-BR")}
          sub={`${panorama.vagas.toLocaleString("pt-BR")} vagas`}
        />
        <KpiCard
          icone={FileSignature}
          rotulo="Com repasse"
          valor={panorama.comRepasse.toLocaleString("pt-BR")}
          sub={`${panorama.ambos} também contratadas`}
        />
        <KpiCard icone={Landmark} rotulo="Repasse total" valor={fBRL(panorama.repasse)} sub="emendas parlamentares" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ ou cidade…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os tipos</SelectItem>
            {TIPOS.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={uf} onValueChange={setUf}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="UF" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas UFs</SelectItem>
            {ufs.map((u) => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-xs text-muted-foreground">
        {filtrados.length.toLocaleString("pt-BR")} de {dados.length.toLocaleString("pt-BR")} comunidades
      </div>

      {/* Tabela unificada */}
      <Card className="min-w-0 p-0">
        <div className="max-h-[560px] overflow-auto rounded-xl">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                {["Nome", "CNPJ", "Cidade/UF", "Tipo", "Vagas", "Recurso contrato", "Repasse", "Emendas"].map((h) => (
                  <TableHead key={h} className="px-3">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Nenhuma comunidade para esse recorte.
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((r, i) => (
                  <TableRow key={`${r.cnpj}-${i}`}>
                    <TableCell className="px-3 font-medium">{r.nome || "—"}</TableCell>
                    <TableCell className="px-3">{r.cnpj || "—"}</TableCell>
                    <TableCell className="px-3">{[r.cidade, r.uf].filter(Boolean).join(" — ") || "—"}</TableCell>
                    <TableCell className="px-3">
                      <Badge className={CORES_TIPO[r.tipo]}>{r.tipo}</Badge>
                    </TableCell>
                    <TableCell className="px-3 tabular-nums">{r.vagas_contratadas || "—"}</TableCell>
                    <TableCell className="px-3 tabular-nums">{r.recurso_anual_contrato ? fBRL(r.recurso_anual_contrato) : "—"}</TableCell>
                    <TableCell className="px-3 tabular-nums">{r.valor_repasse_total ? fBRL(r.valor_repasse_total) : "—"}</TableCell>
                    <TableCell className="px-3 tabular-nums">{r.qtd_emendas || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
