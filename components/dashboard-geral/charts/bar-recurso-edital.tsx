"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { DollarSign } from "lucide-react";
import { fetchDashboard } from "@/lib/dashboard-cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RecursoEntry {
  edital: string;
  total: number;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function BarRecursoSkeleton() {
  const heights = [90, 10, 75];
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-4 w-72 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="flex h-70 items-end justify-around gap-4 px-8 pb-6">
          {heights.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <Skeleton className="w-full rounded" style={{ height: `${h}%` }} />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-4 w-64" />
      </CardFooter>
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
  total: { label: "Recurso Anual", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function BarRecursoPorEdital() {
  const [data, setData] = useState<RecursoEntry[] | null>(null);

  useEffect(() => {
    fetchDashboard<RecursoEntry[]>("recursos").then(setData).catch(console.error);
  }, []);

  const totalGeral = useMemo(
    () => data?.reduce((acc, d) => acc + d.total, 0) ?? 0,
    [data],
  );

  if (!data) return <BarRecursoSkeleton />;

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle>Recurso Anual por Edital</CardTitle>
        <CardDescription>Previsão total de recurso financeiro por ano de edital</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-70 w-full">
          <BarChart accessibilityLayer data={data} margin={{ top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="edital" tickLine={false} axisLine={false} tick={{ fontSize: 13 }} />
            <YAxis
              tickLine={false} axisLine={false}
              tickFormatter={formatBRLShort}
              tick={{ fontSize: 11 }} width={72}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => formatBRL(value as number)}
                  hideLabel
                />
              }
            />
            <Bar
              dataKey="total"
              fill="var(--color-total)"
              radius={[6, 6, 0, 0]}
              isAnimationActive
              animationDuration={350}
              animationEasing="ease-out"
              animationBegin={0}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex items-center gap-2 text-sm text-muted-foreground">
        <DollarSign className="h-4 w-4 shrink-0" />
        <span>
          Total previsto:{" "}
          <strong className="text-foreground">{formatBRL(totalGeral)}</strong>
        </span>
      </CardFooter>
    </Card>
  );
}