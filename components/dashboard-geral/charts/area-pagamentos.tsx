"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig, ChartContainer, ChartLegend, ChartLegendContent,
  ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Year = "2021" | "2022" | "2024";

interface MonthlyEntry {
  mes: string;
  total: number;
  cts: number;
}

// ---------------------------------------------------------------------------
// Data generation helper
// ---------------------------------------------------------------------------
const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function generateMonthlyData(
  baseTotal: number,
  baseCTs: number,
  peakMonth: number,
  spreadMonths: number,
): MonthlyEntry[] {
  return MONTHS_PT.map((mes, i) => {
    const progress = Math.min(1, Math.max(0, (i - peakMonth + spreadMonths) / spreadMonths));
    const ratio = 1 / (1 + Math.exp(-6 * (progress - 0.5)));
    return {
      mes,
      total: Math.round((baseTotal / 12) * ratio),
      cts: Math.round(baseCTs * ratio),
    };
  });
}

// ---------------------------------------------------------------------------
// Fetch — substitua o setTimeout por fetch real
// ---------------------------------------------------------------------------
async function fetchData(): Promise<Record<Year, MonthlyEntry[]>> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          "2021": generateMonthlyData(80_543_191, 203, 10, 3),
          "2022": generateMonthlyData(7_047_447,  19,  5,  4),
          "2024": generateMonthlyData(67_814_504, 178, 4,  5),
        }),
      1800,
    ),
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function AreaPagamentosSkeleton() {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-8 w-36 shrink-0 rounded-lg" />
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-6">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
        <Skeleton className="h-70 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

function formatBRLShort(value: number) {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `R$${(value / 1_000).toFixed(0)}K`;
  return formatBRL(value);
}

// ---------------------------------------------------------------------------
// Chart config
// ---------------------------------------------------------------------------
const chartConfig = {
  total: { label: "Recurso Mensal", color: "var(--primary)" },
  cts:   { label: "CTs Ativas",     color: "var(--accent)" },
} satisfies ChartConfig;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AreaPagamentos() {
  const [yearlyData, setYearlyData] = useState<Record<Year, MonthlyEntry[]> | null>(null);
  const [activeYear, setActiveYear] = useState<Year>("2024");

  useEffect(() => {
    fetchData().then(setYearlyData);
  }, []);

  if (!yearlyData) return <AreaPagamentosSkeleton />;

  const data = yearlyData[activeYear];
  const totalAno = data.reduce((acc, d) => acc + d.total, 0);
  const maxCTs = Math.max(...data.map((d) => d.cts));

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <CardTitle>Pagamentos por Mês</CardTitle>
          <CardDescription>
            Recurso mensal e CTs ativas — edital <strong>{activeYear}</strong>
          </CardDescription>
        </div>

        <ToggleGroup
          type="single"
          value={activeYear}
          onValueChange={(v) => v && setActiveYear(v as Year)}
          className="self-start shrink-0 rounded-lg border p-1"
          size="sm"
        >
          {(["2021", "2022", "2024"] as Year[]).map((yr) => (
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
        <div className="mb-4 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-muted-foreground">Total anual</p>
            <p className="text-lg font-semibold">{formatBRL(totalAno)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Pico de CTs ativas</p>
            <p className="text-lg font-semibold">{maxCTs}</p>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-70 w-full">
          <AreaChart accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--color-total)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillCts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--color-cts)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-cts)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="recurso" tickLine={false} axisLine={false}
              tickFormatter={formatBRLShort} tick={{ fontSize: 11 }} width={64}
            />
            <YAxis
              yAxisId="cts" orientation="right"
              tickLine={false} axisLine={false}
              tick={{ fontSize: 11 }} width={28}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) =>
                    name === "total" ? formatBRL(value as number) : `${value} CTs`
                  }
                />
              }
            />
            <ChartLegend content={<ChartLegendContent payload={undefined} />} />
            <Area
              yAxisId="recurso" type="monotone" dataKey="total"
              stroke="var(--color-total)" strokeWidth={3} fill="url(#fillTotal)"
              animationDuration={1500}
            />
            <Area
              yAxisId="cts" type="monotone" dataKey="cts"
              stroke="var(--color-cts)" strokeWidth={3}
              fill="url(#fillCts)" strokeDasharray="6 4"
              animationDuration={2000}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
