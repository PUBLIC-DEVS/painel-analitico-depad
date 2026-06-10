"use client";

/**
 * Setor Repasses — emendas parlamentares (TransfereGov), espelhando o painel do
 * Power BI: KPIs no topo, quebras por partido/situação/modalidade/secretaria e a
 * tabela de demanda por técnico. Busca a lista de propostas uma vez e agrega/
 * filtra em memória (os selects de situação e partido recalculam tudo).
 *
 * Dados hoje são de demonstração (lib/transferegov-mock); a fonte real entra em
 * fetchPropostas() sem mexer nesta tela.
 */

import { useEffect, useMemo, useState } from "react";
import { Landmark, FileStack, Clock, HandCoins } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarRepasses } from "@/components/dashboard-repasses/bar-repasses";
import { fBRL, fBRLShort } from "@/lib/formatters";
import { resumoRepasses, contarPor, demandaPorTecnico, type Proposta } from "@/lib/transferegov";

const TODOS = "all";

export default function RepassesView() {
  const [props, setProps] = useState<Proposta[] | null>(null);
  const [situacao, setSituacao] = useState(TODOS);
  const [partido, setPartido] = useState(TODOS);

  useEffect(() => {
    fetch("/api/dashboard/repasses")
      .then((r) => r.json())
      .then(setProps)
      .catch(console.error);
  }, []);

  const opcoes = useMemo(() => {
    if (!props) return { situacoes: [], partidos: [] };
    return {
      situacoes: [...new Set(props.map((p) => p.situacao))].sort(),
      partidos: [...new Set(props.map((p) => p.partido))].sort(),
    };
  }, [props]);

  const filtrados = useMemo(() => {
    if (!props) return [];
    return props.filter(
      (p) => (situacao === TODOS || p.situacao === situacao) && (partido === TODOS || p.partido === partido),
    );
  }, [props, situacao, partido]);

  const resumo = useMemo(() => resumoRepasses(filtrados), [filtrados]);
  const tecnicos = useMemo(() => demandaPorTecnico(filtrados), [filtrados]);

  if (!props) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard icone={Landmark} rotulo="Indicação total" valor={fBRL(resumo.indicacaoTotal)} />
        <KpiCard icone={FileStack} rotulo="Qtd propostas" valor={resumo.qtdPropostas.toLocaleString("pt-BR")} />
        <KpiCard icone={Clock} rotulo="Tempo médio formalização" valor={`${resumo.tempoMedioFormalizacao} dias`} />
        <KpiCard icone={HandCoins} rotulo="Contrapartida" valor={fBRL(resumo.contrapartida)} />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Select value={situacao} onValueChange={setSituacao}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Toda situação</SelectItem>
            {opcoes.situacoes.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={partido} onValueChange={setPartido}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Partido" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todo partido</SelectItem>
            {opcoes.partidos.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtrados.length} propostas no recorte</span>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarRepasses
          titulo="Proposta por partido"
          descricao="Quantidade de propostas por partido do autor da emenda"
          arquivo="repasses-por-partido"
          dados={contarPor(filtrados, "partido")}
          horizontal
        />
        <BarRepasses
          titulo="Proposta por situação"
          descricao="Andamento das propostas"
          arquivo="repasses-por-situacao"
          dados={contarPor(filtrados, "situacao")}
          horizontal
        />
        <BarRepasses
          titulo="Proposta por modalidade"
          arquivo="repasses-por-modalidade"
          dados={contarPor(filtrados, "modalidade")}
        />
        <BarRepasses
          titulo="Proposta por secretaria finalística"
          arquivo="repasses-por-secretaria"
          dados={contarPor(filtrados, "secretaria")}
        />
      </div>

      {/* Demanda por técnico */}
      <Card className="min-w-0 p-0">
        <div className="border-b px-4 py-3 text-sm font-medium">Demanda por técnico</div>
        <div className="max-h-[420px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className="px-3">Analista responsável</TableHead>
                <TableHead className="px-3 text-right">Soma GND3</TableHead>
                <TableHead className="px-3 text-right">Soma GND4</TableHead>
                <TableHead className="px-3 text-right">Dias p/ formalização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tecnicos.map((t) => (
                <TableRow key={t.analista}>
                  <TableCell className="px-3 font-medium">{t.analista}</TableCell>
                  <TableCell className="px-3 text-right tabular-nums">{fBRLShort(t.gnd3)}</TableCell>
                  <TableCell className="px-3 text-right tabular-nums">{fBRLShort(t.gnd4)}</TableCell>
                  <TableCell className="px-3 text-right tabular-nums">{t.dias || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
