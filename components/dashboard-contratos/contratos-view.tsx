"use client";

/**
 * Setor Contratos — workbench filtrável das CTs contratadas (aba BASE).
 *
 * Diferente do Geral (visão geral) e da Base de dados (tabela crua): aqui o foco
 * é filtrar e inspecionar. Busca a lista uma vez (cache) e filtra tudo em memória
 * — UF, situação, ano e texto — então os filtros respondem na hora, sem ida ao
 * servidor a cada tecla. Os cards e a faixa de situação recalculam junto com o
 * recorte (estilo Qlik: o filtro move o painel todo, não só a tabela).
 */

import { useEffect, useMemo, useState } from "react";
import { Search, Building2, BedDouble, Banknote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fBRL, parseBRL } from "@/lib/formatters";
import { fetchDashboard } from "@/lib/dashboard-cache";
import type { Comunidade } from "@/lib/dashboard-data";

// Situações conhecidas + cor da faixa. "—" cobre os contratos sem status.
const SITUACOES: { id: string; label: string; cor: string }[] = [
  { id: "ATIVO", label: "Ativo", cor: "var(--chart-2)" },
  { id: "RESCINDIDO", label: "Rescindido", cor: "var(--destructive)" },
  { id: "FINALIZADO", label: "Finalizado", cor: "var(--muted-foreground)" },
  { id: "—", label: "Sem situação", cor: "var(--border)" },
];

const TODOS = "all";

/** Faixa de situação: uma barra segmentada proporcional + legenda clicável. */
function FaixaSituacao({
  contagem,
  total,
  ativa,
  onToggle,
}: {
  contagem: Record<string, number>;
  total: number;
  ativa: string;
  onToggle: (s: string) => void;
}) {
  return (
    <Card className="gap-0 p-3">
      <div className="mb-2 text-sm font-medium">Situação dos contratos</div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
        {SITUACOES.map((s) => {
          const w = total ? (contagem[s.id] ?? 0) / total : 0;
          return w > 0 ? <div key={s.id} style={{ width: `${w * 100}%`, background: s.cor }} /> : null;
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {SITUACOES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onToggle(s.id)}
            className={`flex items-center gap-1.5 text-xs transition-opacity ${
              ativa !== TODOS && ativa !== s.id ? "opacity-40" : ""
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.cor }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-semibold tabular-nums">{contagem[s.id] ?? 0}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

export default function ContratosView() {
  const [dados, setDados] = useState<Comunidade[] | null>(null);
  const [uf, setUf] = useState(TODOS);
  const [situacao, setSituacao] = useState(TODOS);
  const [ano, setAno] = useState(TODOS);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    fetchDashboard<Comunidade[]>("comunidades").then(setDados).catch(console.error);
  }, []);

  const ufs = useMemo(
    () => (dados ? [...new Set(dados.map((r) => r.uf).filter(Boolean))].sort() : []),
    [dados],
  );
  const anos = useMemo(
    () => (dados ? [...new Set(dados.map((r) => r.ano).filter(Boolean))].sort((a, b) => b - a) : []),
    [dados],
  );

  const filtrados = useMemo(() => {
    if (!dados) return [];
    const q = busca.toLowerCase().trim();
    return dados.filter((r) => {
      const sit = r.status_ct || "—";
      return (
        (uf === TODOS || r.uf === uf) &&
        (situacao === TODOS || sit === situacao) &&
        (ano === TODOS || String(r.ano) === ano) &&
        (!q ||
          r.razao_social.toLowerCase().includes(q) ||
          r.cnpj.includes(busca) ||
          r.cidade.toLowerCase().includes(q))
      );
    });
  }, [dados, uf, situacao, ano, busca]);

  const resumo = useMemo(() => {
    const contagem: Record<string, number> = {};
    let vagas = 0,
      recurso = 0;
    for (const r of filtrados) {
      contagem[r.status_ct || "—"] = (contagem[r.status_ct || "—"] ?? 0) + 1;
      vagas += r.vagas_contratadas ?? 0;
      recurso += parseBRL(r.recurso_anual);
    }
    return { contagem, vagas, recurso };
  }, [filtrados]);

  if (!dados) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full rounded-md" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  // Alterna a situação clicando na legenda (clicar na ativa limpa o filtro).
  const toggleSituacao = (s: string) => setSituacao((atual) => (atual === s ? TODOS : s));

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por razão social, CNPJ ou cidade…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-8"
          />
        </div>
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
        <Select value={situacao} onValueChange={setSituacao}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Toda situação</SelectItem>
            {SITUACOES.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ano} onValueChange={setAno}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todo ano</SelectItem>
            {anos.map((a) => (
              <SelectItem key={a} value={String(a)}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs do recorte */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        <KpiCard icone={Building2} rotulo="Contratos" valor={String(filtrados.length)} />
        <KpiCard icone={BedDouble} rotulo="Vagas contratadas" valor={resumo.vagas.toLocaleString("pt-BR")} />
        <KpiCard icone={Banknote} rotulo="Recurso anual" valor={fBRL(resumo.recurso)} />
      </div>

      <FaixaSituacao contagem={resumo.contagem} total={filtrados.length} ativa={situacao} onToggle={toggleSituacao} />

      {/* Lista filtrada */}
      <Card className="min-w-0 p-0">
        <div className="max-h-[520px] overflow-auto rounded-xl">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                {["Contrato", "Razão social", "Cidade/UF", "Vagas", "Recurso/ano", "Situação", "Vencimento"].map((h) => (
                  <TableHead key={h} className="px-3">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhum contrato para esse recorte.
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((r, i) => (
                  <TableRow key={`${r.contrato_ano}-${i}`}>
                    <TableCell className="px-3 font-medium">{r.contrato_ano}</TableCell>
                    <TableCell className="px-3">{r.razao_social || "—"}</TableCell>
                    <TableCell className="px-3">{[r.cidade, r.uf].filter(Boolean).join(" — ") || "—"}</TableCell>
                    <TableCell className="px-3 tabular-nums">{r.vagas_contratadas || "—"}</TableCell>
                    <TableCell className="px-3 tabular-nums">{r.recurso_anual || "—"}</TableCell>
                    <TableCell className="px-3">
                      {r.status_ct ? <Badge variant="secondary">{r.status_ct}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="px-3">{r.data_vencimento_ct || "—"}</TableCell>
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
