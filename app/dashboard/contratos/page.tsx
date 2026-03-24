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

// ============================================================
// MOCK DATA — substitua pelos fetches reais
// ============================================================
const MOCK_COMUNIDADES: Comunidade[] = Array.from({ length: 60 }, (_, i) => {
  const ufs = ["RS", "MG", "SP", "PR", "SC", "CE", "AL", "RJ", "GO", "DF"];
  const anos = [2018, 2019, 2021, 2022, 2024, 2025];
  const st = (["ATIVO", "ATIVO", "ATIVO", "FINALIZADO", "RESCINDIDO"] as const)[
    i % 5
  ];
  const uf = ufs[i % ufs.length];
  const ano = anos[i % anos.length];
  const vagas = 10 + (i % 40);
  return {
    contrato_ano: `CT-${1000 + i}/${ano}`,
    razao_social: `Comunidade Terapêutica ${String.fromCharCode(65 + (i % 26))} ${i + 1}`,
    nome_fantasia: `CT ${String.fromCharCode(65 + (i % 26))}${i + 1}`,
    cnpj: `${10 + i}.000.00${i % 9}/0001-${10 + (i % 90)}`,
    cidade: [
      "Porto Alegre",
      "Belo Horizonte",
      "São Paulo",
      "Curitiba",
      "Florianópolis",
      "Fortaleza",
    ][i % 6],
    uf,
    contrato: `TED-${2000 + i}`,
    ano,
    endereco: `Rua das Flores, ${i + 100}`,
    telefone: `(61) 9${9000 + i}-0000`,
    email: `ct${i + 1}@exemplo.org`,
    vagas_contratadas: vagas,
    adulto_masc: Math.round(vagas * 0.6),
    adulto_feminino: Math.round(vagas * 0.3),
    maes: Math.round(vagas * 0.1),
    recurso_anual: `R$ ${(vagas * 8_400).toLocaleString("pt-BR")},00`,
    recurso_mensal: `R$ ${(vagas * 700).toLocaleString("pt-BR")},00`,
    status_ct: st,
    data_inicial_ct: `01/0${(i % 12) + 1}/${ano}`,
    data_vencimento_ct: `31/1${i % 2}/2026`,
  };
});

const MOCK_STATS = {
  contratosTotais: 60,
  vagasDisponiveis: 3_200,
  vagasContratadas: 2_840,
  vagasMaes: 312,
  vagasFemininas: 960,
  vagasMasculinas: 1_568,
};

const MONTHS_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function genMonthly(base: number, paidUpTo: number) {
  return MONTHS_PT.map((mes, i) => ({
    mes,
    pago: i < paidUpTo ? Math.round(base * (0.85 + Math.random() * 0.3)) : 0,
    previsto: Math.round(base),
  }));
}

const MONTHLY_DATA: Record<Year, ReturnType<typeof genMonthly>> = {
  "2023": genMonthly(6_800_000, 12),
  "2024": genMonthly(7_200_000, 12),
  "2025": genMonthly(8_100_000, 3),
  "2026": genMonthly(8_600_000, 0),
};

const ORCAMENTO = {
  anual: 155_400_000,
  mensal: 12_950_000,
  mediaUso: 11_200_000,
  avgPct: 86.5,
  mensal_pct: 100,
  anual_pct: 86.5,
};

const EDITAL_DATA = [
  { edital: "2018", total: 229 },
  { edital: "2019", total: 198 },
  { edital: "2021", total: 203 },
  { edital: "2022", total: 19 },
  { edital: "2024", total: 178 },
  { edital: "2025", total: 234 },
];

const UF_DATA = [
  { uf: "RS", total: 84 },
  { uf: "MG", total: 84 },
  { uf: "SP", total: 57 },
  { uf: "PR", total: 53 },
  { uf: "SC", total: 48 },
  { uf: "CE", total: 36 },
  { uf: "AL", total: 30 },
  { uf: "RJ", total: 29 },
  { uf: "GO", total: 25 },
  { uf: "PI", total: 22 },
  { uf: "MA", total: 18 },
  { uf: "RN", total: 17 },
  { uf: "BA", total: 13 },
  { uf: "PE", total: 12 },
  { uf: "MS", total: 12 },
  { uf: "DF", total: 11 },
];

const TOP_VAGAS_DATA = MOCK_COMUNIDADES.filter(
  (c) => c.vagas_contratadas != null,
)
  .sort((a, b) => (b.vagas_contratadas ?? 0) - (a.vagas_contratadas ?? 0))
  .slice(0, 10)
  .map((c) => ({ nome: c.nome_fantasia, vagas: c.vagas_contratadas ?? 0 }));

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
  total: { label: "Comunidades", color: "hsl(var(--chart-2))" },
};
const cfgUF: ChartConfig = {
  total: { label: "Comunidades", color: "hsl(var(--chart-1))" },
};
const cfgVagas: ChartConfig = {
  vagas: { label: "Vagas", color: "hsl(var(--chart-3))" },
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ufFilter, setUfFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const data = MOCK_COMUNIDADES;

  const ufs = useMemo(
    () => Array.from(new Set(data.map((r) => r.uf))).sort(),
    [data],
  );
  const statuses = useMemo(
    () => Array.from(new Set(data.map((r) => r.status_ct))).sort(),
    [data],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((row) => {
      const ms =
        !search ||
        row.razao_social?.toLowerCase().includes(q) ||
        row.nome_fantasia?.toLowerCase().includes(q) ||
        row.cnpj?.includes(search) ||
        row.cidade?.toLowerCase().includes(q);
      return (
        ms &&
        (statusFilter === "all" || row.status_ct === statusFilter) &&
        (ufFilter === "all" || row.uf === ufFilter)
      );
    });
  }, [data, search, statusFilter, ufFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalEdital = EDITAL_DATA.reduce((a, d) => a + d.total, 0);

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

  return (
    <div className="flex flex-col gap-4">
      {/* ── CARDS ── */}
      <div className="flex flex-wrap gap-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Contratos Totais"
              value={MOCK_STATS.contratosTotais.toLocaleString("pt-BR")}
              icon={<FileText size={16} />}
            />
            <StatCard
              label="Vagas Disponíveis"
              value={MOCK_STATS.vagasDisponiveis.toLocaleString("pt-BR")}
              icon={<BedDouble size={16} />}
            />
            <StatCard
              label="Vagas Contratadas"
              value={MOCK_STATS.vagasContratadas.toLocaleString("pt-BR")}
              icon={<Home size={16} />}
            />
            <StatCard
              label="Vagas para Mães Nutrizes"
              value={MOCK_STATS.vagasMaes.toLocaleString("pt-BR")}
              icon={<Baby size={16} />}
            />
            <StatCard
              label="Vagas Femininas"
              value={MOCK_STATS.vagasFemininas.toLocaleString("pt-BR")}
              icon={<Users size={16} />}
            />
            <StatCard
              label="Vagas Masculinas"
              value={MOCK_STATS.vagasMasculinas.toLocaleString("pt-BR")}
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
                  data={EDITAL_DATA}
                  margin={{ top: 24 }}
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
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Contratos por UF</CardTitle>
            <CardDescription>
              Número de CTs registradas por estado (top 16)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-md" />
            ) : (
              <ChartContainer config={cfgUF} className="h-64 w-full">
                <BarChart
                  accessibilityLayer
                  data={UF_DATA}
                  layout="vertical"
                  margin={{ left: 0, right: 36, top: 0, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="uf"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={26}
                    tick={{ fontSize: 11 }}
                  />
                  <XAxis dataKey="total" type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={4}>
                    <LabelList
                      dataKey="total"
                      position="right"
                      offset={6}
                      className="fill-foreground"
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
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
            <ChartContainer config={cfgVagas} className="h-56 w-full">
              <BarChart
                accessibilityLayer
                data={TOP_VAGAS_DATA}
                layout="vertical"
                margin={{ left: 8, right: 48, top: 0, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="nome"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  tick={{ fontSize: 10 }}
                />
                <XAxis dataKey="vagas" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="vagas" fill="var(--color-vagas)" radius={4}>
                  <LabelList
                    dataKey="vagas"
                    position="right"
                    offset={6}
                    className="fill-foreground"
                    fontSize={11}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
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
            {filtered.length} comunidade{filtered.length !== 1 ? "s" : ""}{" "}
            encontrada
            {filtered.length !== 1 ? "s" : ""}
            {data.length > 0 && ` de ${data.length} no total`}
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
                {paginated.length === 0 ? (
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
              {filtered.length > 0 &&
                ` — exibindo ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} de ${filtered.length}`}
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
  const [activeYear, setActiveYear] = useState<Year>("2025");
  const [showPct, setShowPct] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const monthData = MONTHLY_DATA[activeYear];
  const totalPago = monthData.reduce((a, d) => a + d.pago, 0);
  const totalPrev = monthData.reduce((a, d) => a + d.previsto, 0);
  const execPct =
    totalPrev > 0 ? ((totalPago / totalPrev) * 100).toFixed(1) : "0";

  const cardData = [
    {
      label: "Orçamento Anual",
      num: fBRL(ORCAMENTO.anual),
      pct: `${ORCAMENTO.anual_pct.toFixed(1)}% executado`,
      icon: <Wallet size={16} />,
    },
    {
      label: "Orçamento Mensal",
      num: fBRL(ORCAMENTO.mensal),
      pct: `${ORCAMENTO.mensal_pct.toFixed(0)}% previsto`,
      icon: <DollarSign size={16} />,
    },
    {
      label: "Média de Uso por Mês",
      num: fBRL(ORCAMENTO.mediaUso),
      pct: `${ORCAMENTO.avgPct.toFixed(1)}% da previsão`,
      icon: <BarChart2 size={16} />,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ── CARDS ── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap flex-1 gap-3">
          {loading
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
            {(["2023", "2024", "2025", "2026"] as Year[]).map((yr) => (
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
export default function ContratosPage() {
  const TabChanger = () => {
    return (
      <TabsList className="border font-mono">
        <TabsTrigger value="comunidades">Comunidades</TabsTrigger>
        <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
      </TabsList>
    );
  };
  return (
    <div>
      <Tabs defaultValue="comunidades" className="w-full">
      <Title
        title="Dashboard de contratos"
        subtitle=""
        filterComponent={<TabChanger/>}
      />
      <div className="flex flex-col  p-4">
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
