"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import {
  BedDouble,
  Baby,
  User,
  Users,
  Wallet,
  FileText,
  Home,
  TrendingUp,
  DollarSign,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Search,
  PercentIcon,
  HashIcon,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Title from "@/components/Title";
import BarPorUF from "@/components/dashboard-geral/charts/bar-por-uf";
import type { PagamentosData } from "@/app/api/dashboard/contratos/_types";

// ============================================================
// TYPES
// ============================================================
type Year = "2023" | "2024" | "2025" | "2026";

interface Comunidade {
  contrato_ano: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  cidade: string;
  uf: string;
  contrato: string;
  ano: number;
  endereco: string;
  telefone: string;
  email: string;
  vagas_contratadas: number | null;
  adulto_masc: number | null;
  adulto_feminino: number | null;
  maes: number | null;
  recurso_anual: string;
  recurso_mensal: string;
  status_ct: "ATIVO" | "FINALIZADO" | "RESCINDIDO" | string;
  data_inicial_ct: string;
  data_vencimento_ct: string;
}

interface Stats {
  totalVagas: number;
  vagasMasculinas: number;
  vagasFemininas: number;
  vagasParaMaes: number;
  orcamentoAnual: string;
  contratosRegistrados: number;
  comunidadesTerapeuticas: number;
}

interface EditalEntry {
  edital: string;
  total: number;
}

interface UfEntry {
  uf: string;
  total: number;
}

// ============================================================
// FORMATTERS
// ============================================================
function fBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}
function fBRLShort(v: number) {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}K`;
  return fBRL(v);
}

// ============================================================
// FETCH HELPER
// ============================================================
async function fetchResource<T>(resource: string): Promise<T> {
  const res = await fetch(`/api/dashboard/contratos?resource=${resource}`);
  if (!res.ok) throw new Error(`Erro ao buscar ${resource}: ${res.status}`);
  return res.json() as Promise<T>;
}

// ============================================================
// SMALL STAT CARD
// ============================================================
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}
function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="flex flex-1 flex-col gap-0.5 rounded-lg border border-border bg-card px-4 py-3 min-w-44">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <span className="text-xl font-semibold tracking-tight">{value}</span>
    </div>
  );
}
function StatCardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-0.5 rounded-lg border border-border bg-card px-4 py-3 min-w-44">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="mt-1 h-6 w-24" />
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================
function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    ATIVO: "default",
    FINALIZADO: "secondary",
    RESCINDIDO: "destructive",
  };
  return (
    <Badge
      variant={variants[status] ?? "outline"}
      className="whitespace-nowrap"
    >
      {status}
    </Badge>
  );
}

// ============================================================
// CHART CONFIGS
// ============================================================
const cfgEdital: ChartConfig = {
  total: { label: "Total", color: "hsl(var(--chart-2))" },
};
const cfgPag: ChartConfig = {
  pago: { label: "Pago", color: "hsl(var(--chart-1))" },
  previsto: { label: "Previsto", color: "hsl(var(--chart-2))" },
};

// ============================================================
// ABA COMUNIDADES
// ============================================================
function AbaComunidades() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [editalData, setEditalData] = useState<EditalEntry[]>([]);
  const [ufData, setUfData] = useState<UfEntry[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ufFilter, setUfFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    Promise.all([
      fetchResource<Stats>("stats"),
      fetchResource<Comunidade[]>("comunidades"),
      fetchResource<EditalEntry[]>("editais"),
      fetchResource<UfEntry[]>("uf"),
    ])
      .then(([statsData, comunidadesData, editaisData, ufDataRes]) => {
        setStats(statsData);
        setComunidades(comunidadesData);
        setEditalData(editaisData);
        setUfData(ufDataRes);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const ufs = useMemo(
    () =>
      Array.from(new Set(comunidades.map((r) => r.uf)))
        .filter(Boolean) // 👈 Removes "", null, and undefined
        .sort(),
    [comunidades],
  );
  const statuses = useMemo(
    () =>
      Array.from(new Set(comunidades.map((r) => r.status_ct)))
        .filter(Boolean) // 👈 Removes "", null, and undefined
        .sort(),
    [comunidades],
  );

  const mapFiltered = useMemo(() => {
    const q = search.toLowerCase();
    return comunidades.filter((row) => {
      const ms =
        !search ||
        row.razao_social?.toLowerCase().includes(q) ||
        row.nome_fantasia?.toLowerCase().includes(q) ||
        row.cnpj?.includes(search) ||
        row.cidade?.toLowerCase().includes(q);
      return ms && (statusFilter === "all" || row.status_ct === statusFilter);
    });
  }, [comunidades, search, statusFilter]);

  const dynamicUfData = useMemo(() => {
    if (search === "" && statusFilter === "all" && ufData.length > 0) return ufData;
    const counts: Record<string, number> = {};
    for (const c of mapFiltered) {
      if (c.uf) counts[c.uf] = (counts[c.uf] || 0) + 1;
    }
    return Object.entries(counts).map(([uf, total]) => ({ uf, total }));
  }, [mapFiltered, ufData, search, statusFilter]);

  const filtered = useMemo(() => {
    return mapFiltered.filter((row) => ufFilter === "all" || row.uf === ufFilter);
  }, [mapFiltered, ufFilter]);

  const dynamicStats = useMemo(() => {
    if (ufFilter === "all" && search === "" && statusFilter === "all" && stats) {
      return stats;
    }
    let totalVagas = 0, vagasMasc = 0, vagasFem = 0, vagasMaes = 0;
    for (const c of filtered) {
      totalVagas += c.vagas_contratadas || 0;
      vagasMasc += c.adulto_masc || 0;
      vagasFem += c.adulto_feminino || 0;
      vagasMaes += c.maes || 0;
    }
    return {
      totalVagas,
      vagasMasculinas: vagasMasc,
      vagasFemininas: vagasFem,
      vagasParaMaes: vagasMaes,
      contratosRegistrados: filtered.length,
      comunidadesTerapeuticas: filtered.length,
      orcamentoAnual: stats ? stats.orcamentoAnual : "R$ 0",
    };
  }, [filtered, stats, ufFilter, search, statusFilter]);

  const topVagasData = useMemo(
    () =>
      filtered
        .filter((c) => c.vagas_contratadas != null)
        .sort((a, b) => (b.vagas_contratadas ?? 0) - (a.vagas_contratadas ?? 0))
        .slice(0, 10)
        .map((c) => ({
          nome: c.nome_fantasia || c.razao_social || c.cnpj || "Sem identificação",
          vagas: c.vagas_contratadas ?? 0,
        })),
    [filtered],
  );
  const maxTopVagas = Math.max(1, ...topVagasData.map((v) => v.vagas));

  const dynamicEditalData = useMemo(() => {
    if (ufFilter === "all" && search === "" && statusFilter === "all" && editalData.length > 0) return editalData;
    const counts: Record<string, number> = {};
    for (const c of filtered) {
      if (c.ano) counts[c.ano.toString()] = (counts[c.ano.toString()] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([edital, total]) => ({ edital, total }))
      .sort((a, b) => a.edital.localeCompare(b.edital));
  }, [filtered, editalData, ufFilter, search, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const anoA = a.ano || 0;
      const anoB = b.ano || 0;
      if (anoA !== anoB) return anoB - anoA;
      const caA = a.contrato_ano || "";
      const caB = b.contrato_ano || "";
      return caB.localeCompare(caA);
    });
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);
  const totalEdital = dynamicEditalData.reduce((a, d) => a + d.total, 0);
  const normalizedSearch = search.trim();
  const hasActiveFilters =
    normalizedSearch !== "" || statusFilter !== "all" || ufFilter !== "all";

  function clearAllFilters() {
    setSearch("");
    setStatusFilter("all");
    setUfFilter("all");
    setPage(1);
  }

  const COLS = [
    { key: "contrato_ano", label: "Contrato/Ano" },
    { key: "razao_social", label: "Razão Social" },
    { key: "nome_fantasia", label: "Nome Fantasia" },
    { key: "cnpj", label: "CNPJ" },
    { key: "cidade", label: "Cidade" },
    { key: "uf", label: "UF" },
    { key: "vagas_contratadas", label: "Vagas" },
    { key: "adulto_masc", label: "Masc." },
    { key: "adulto_feminino", label: "Fem." },
    { key: "maes", label: "Mães" },
    { key: "recurso_mensal", label: "Recurso/Mês" },
    { key: "status_ct", label: "Status" },
    { key: "data_inicial_ct", label: "Início" },
    { key: "data_vencimento_ct", label: "Vencimento" },
  ] as const;

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        Erro ao carregar dados: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── CARDS ── */}
      <div className="flex flex-wrap gap-3">
        {loading || !dynamicStats ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            <StatCard
              label="Contratos Registrados"
              value={dynamicStats.contratosRegistrados.toLocaleString("pt-BR")}
              icon={<FileText size={16} />}
            />
            <StatCard
              label="Total de Vagas"
              value={dynamicStats.totalVagas.toLocaleString("pt-BR")}
              icon={<BedDouble size={16} />}
            />
            <StatCard
              label="Comunidades Terapêuticas"
              value={dynamicStats.comunidadesTerapeuticas.toLocaleString("pt-BR")}
              icon={<Home size={16} />}
            />
            <StatCard
              label="Vagas para Mães Nutrizes"
              value={dynamicStats.vagasParaMaes.toLocaleString("pt-BR")}
              icon={<Baby size={16} />}
            />
            <StatCard
              label="Vagas Femininas"
              value={dynamicStats.vagasFemininas.toLocaleString("pt-BR")}
              icon={<Users size={16} />}
            />
            <StatCard
              label="Vagas Masculinas"
              value={dynamicStats.vagasMasculinas.toLocaleString("pt-BR")}
              icon={<User size={16} />}
            />
          </>
        )}
      </div>

      {/* ── GRÁFICOS ROW 1 ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
        {/* Contratos por Edital */}
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Contratos por Edital</CardTitle>
            <CardDescription>Número de CTs por ano de edital</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-md" />
            ) : (
              <ChartContainer config={cfgEdital} className="h-64 w-full">
                <BarChart
                  accessibilityLayer
                  data={dynamicEditalData}
                  margin={{ left: -20, right: 12, top: 24, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="edital"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 13 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar
                    dataKey="total"
                    fill="var(--color-total)"
                    radius={[6, 6, 0, 0]}
                  >
                    <LabelList
                      position="top"
                      offset={6}
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
          <CardFooter className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span>
              Total de{" "}
              <strong className="text-foreground">{totalEdital}</strong>{" "}
              comunidades em todos os editais
            </span>
          </CardFooter>
        </Card>

        {/* Contratos por UF */}
        <div className="h-[420px] lg:h-auto">
          <BarPorUF 
            data={dynamicUfData} 
            activeUf={ufFilter}
            onUfClick={(uf) => {
              setUfFilter(prev => prev === uf ? "all" : uf);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* ── GRÁFICO TOP VAGAS ── */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Contratos com Maior Número de Vagas</CardTitle>
          <CardDescription>
            Top 10 comunidades terapêuticas por vagas contratadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-56 w-full rounded-md" />
          ) : (
            <div className="flex flex-col gap-4 py-2">
              {topVagasData.map((d, i) => {
                return (
                  <div 
                    key={i} 
                    className="group cursor-pointer space-y-1.5"
                    onClick={() => {
                      setSearch(d.nome);
                      setPage(1);
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[11px] font-semibold text-foreground/80 group-hover:text-primary transition-colors truncate max-w-[280px]">
                        {d.nome}
                      </span>
                      <span className="text-[11px] font-bold text-primary">{d.vagas} vagas</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                      <div 
                        className="h-full bg-primary/70 group-hover:bg-primary transition-all duration-500 ease-out" 
                        style={{ width: `${(d.vagas / maxTopVagas) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart2 className="h-4 w-4 shrink-0" />
          <span>Baseado nas vagas contratadas atualmente ativas</span>
        </CardFooter>
      </Card>

      {/* ── TABELA ── */}
      <Card className="w-full min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Comunidades Terapêuticas</CardTitle>
          <CardDescription>
            {sorted.length} comunidade{sorted.length !== 1 ? "s" : ""}{" "}
            encontrada{sorted.length !== 1 ? "s" : ""}
            {comunidades.length > 0 && ` de ${comunidades.length} no total`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 min-w-0 overflow-hidden">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ, cidade…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 w-full"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44 shrink-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={ufFilter}
              onValueChange={(v) => {
                setUfFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-24 shrink-0">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {ufs.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-28 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s} / pág
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Filtros ativos:</span>
              {normalizedSearch && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 max-w-full gap-1 rounded-full px-2 text-xs"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                >
                  <span className="shrink-0">Busca:</span>
                  <span className="max-w-[220px] truncate">{normalizedSearch}</span>
                  <X className="h-3 w-3" />
                </Button>
              )}
              {statusFilter !== "all" && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 gap-1 rounded-full px-2 text-xs"
                  onClick={() => {
                    setStatusFilter("all");
                    setPage(1);
                  }}
                >
                  Status: {statusFilter}
                  <X className="h-3 w-3" />
                </Button>
              )}
              {ufFilter !== "all" && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 gap-1 rounded-full px-2 text-xs"
                  onClick={() => {
                    setUfFilter("all");
                    setPage(1);
                  }}
                >
                  UF: {ufFilter}
                  <X className="h-3 w-3" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-7 px-2 text-xs"
                onClick={clearAllFilters}
              >
                Limpar filtros
              </Button>
            </div>
          )}

          <div className="w-full overflow-x-auto rounded-md border">
            <Table style={{ width: "max-content", minWidth: "100%" }}>
              <TableHeader>
                <TableRow>
                  {COLS.map((col) => (
                    <TableHead key={col.key} className="whitespace-nowrap px-3">
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {COLS.map((col) => (
                        <TableCell key={col.key} className="px-3">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={COLS.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhum resultado encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((row, idx) => (
                    <TableRow key={`${row.contrato_ano}-${idx}`}>
                      {COLS.map((col) => {
                        const value = row[col.key as keyof Comunidade];
                        if (col.key === "status_ct" && value) {
                          return (
                            <TableCell key={col.key} className="px-3">
                              <StatusBadge status={String(value)} />
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell
                            key={col.key}
                            className="whitespace-nowrap px-3"
                          >
                            {value != null && value !== "" ? (
                              String(value)
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Página {page} de {totalPages}
              {sorted.length > 0 &&
                ` — exibindo ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, sorted.length)} de ${sorted.length}`}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// ABA PAGAMENTOS
// ============================================================
function AbaPagamentos() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagamentosData, setPagamentosData] = useState<PagamentosData | null>(
    null,
  );
  const [activeYear, setActiveYear] = useState<Year>("2025");
  const [showPct, setShowPct] = useState(false);

  useEffect(() => {
    fetchResource<PagamentosData>("pagamentos")
      .then(setPagamentosData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const monthData = pagamentosData?.monthly?.[activeYear] ?? [];
  const orcamento = pagamentosData?.orcamento?.[activeYear];

  const totalPago = monthData.reduce((a, d) => a + d.pago, 0);
  const totalPrev = monthData.reduce((a, d) => a + d.previsto, 0);
  const execPct =
    totalPrev > 0 ? ((totalPago / totalPrev) * 100).toFixed(1) : "0";

  const cardData = orcamento
    ? [
        {
          label: "Orçamento Anual",
          num: fBRL(orcamento.anual),
          pct: `${orcamento.anual_pct.toFixed(1)}% executado`,
          icon: <Wallet size={16} />,
        },
        {
          label: "Orçamento Mensal",
          num: fBRL(orcamento.mensal),
          pct: `${orcamento.mensal_pct.toFixed(0)}% previsto`,
          icon: <DollarSign size={16} />,
        },
        {
          label: "Média de Uso por Mês",
          num: fBRL(orcamento.mediaUso),
          pct: `${orcamento.avgPct.toFixed(1)}% da previsão`,
          icon: <BarChart2 size={16} />,
        },
      ]
    : [];

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        Erro ao carregar dados: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── CARDS ── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap flex-1 gap-3">
          {loading || cardData.length === 0
            ? Array.from({ length: 3 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))
            : cardData.map((c) => (
                <div
                  key={c.label}
                  className="flex flex-1 flex-col gap-0.5 rounded-lg border border-border bg-card px-4 py-3 min-w-44"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {c.label}
                    </span>
                    {c.icon && (
                      <span className="text-muted-foreground">{c.icon}</span>
                    )}
                  </div>
                  <span className="text-xl font-semibold tracking-tight">
                    {showPct ? c.pct : c.num}
                  </span>
                </div>
              ))}
        </div>

        {/* Toggle % / # */}
        <ToggleGroup
          type="single"
          value={showPct ? "pct" : "num"}
          onValueChange={(v) => v && setShowPct(v === "pct")}
          className="self-start shrink-0 rounded-lg border p-1"
          size="sm"
        >
          <ToggleGroupItem
            value="num"
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3 rounded-md"
          >
            <HashIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="pct"
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3 rounded-md"
          >
            <PercentIcon className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* ── GRÁFICO DE PAGAMENTOS ── */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle>Pagamentos por Mês</CardTitle>
            <CardDescription>
              Recurso pago vs. previsto — ano <strong>{activeYear}</strong>
            </CardDescription>
          </div>

          <ToggleGroup
            type="single"
            value={activeYear}
            onValueChange={(v) => v && setActiveYear(v as Year)}
            className="self-start shrink-0 rounded-lg border p-1"
            size="sm"
          >
            {(["2025", "2026"] as Year[]).map((yr) => (
              <ToggleGroupItem
                key={yr}
                value={yr}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3 text-xs rounded-md"
              >
                {yr}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total pago no ano</p>
              <p className="text-lg font-semibold">{fBRL(totalPago)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Previsão total</p>
              <p className="text-lg font-semibold">{fBRL(totalPrev)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Execução</p>
              <p className="text-lg font-semibold">{execPct}%</p>
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-72 w-full rounded-md" />
          ) : (
            <ChartContainer config={cfgPag} className="h-72 w-full">
              <AreaChart
                accessibilityLayer
                data={monthData}
                margin={{ left: 8, right: 8 }}
              >
                <defs>
                  <linearGradient id="fillPago" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-pago)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-pago)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                  <linearGradient id="fillPrevisto" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-previsto)"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-previsto)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={fBRLShort}
                  tick={{ fontSize: 11 }}
                  width={72}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) =>
                        name === "pago" || name === "previsto"
                          ? fBRL(value as number)
                          : String(value)
                      }
                    />
                  }
                />
                <ChartLegend
                  content={<ChartLegendContent payload={undefined} />}
                />
                <Area
                  type="monotone"
                  dataKey="previsto"
                  stroke="var(--color-previsto)"
                  strokeWidth={2}
                  fill="url(#fillPrevisto)"
                  strokeDasharray="4 3"
                />
                <Area
                  type="monotone"
                  dataKey="pago"
                  stroke="var(--color-pago)"
                  strokeWidth={2}
                  fill="url(#fillPago)"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================
function TabChanger() {
  return (
    <TabsList className="border bg-background/80 font-mono backdrop-blur-sm">
      <TabsTrigger value="comunidades">Comunidades</TabsTrigger>
      <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
    </TabsList>
  );
}

export default function ContratosPage() {
  return (
    <div>
      <Tabs defaultValue="comunidades" className="w-full">
        <Title
          title="Dashboard de contratos"
          subtitle="Exploração detalhada da base contratual, com análise por comunidades e por pagamentos."
          filterComponent={<TabChanger />}
        />
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 pb-8">
          <TabsContent value="comunidades">
            <AbaComunidades />
          </TabsContent>
          <TabsContent value="pagamentos">
            <AbaPagamentos />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
