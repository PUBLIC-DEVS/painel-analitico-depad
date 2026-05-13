"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import { fetchDashboard } from "@/lib/dashboard-cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface EditalEntry {
  edital: string;
  total: number;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function BarPorEditalSkeleton() {
  const heights = [80, 70, 75, 20, 65, 90];
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-4 w-60 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="flex h-[280px] items-end justify-around gap-2 px-4 pb-6">
          {heights.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <Skeleton className="w-full rounded" style={{ height: `${h}%` }} />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-4 w-56" />
      </CardFooter>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Chart config
// ---------------------------------------------------------------------------
const chartConfig = {
  total: { label: "Comunidades", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function BarPorEdital({ ufFilter }: { ufFilter?: string }) {
  const [data, setData] = useState<EditalEntry[] | null>(null);

  useEffect(() => {
    const resource = ufFilter && ufFilter !== "all" ? `editais&uf=${ufFilter}` : "editais";
    fetchDashboard<EditalEntry[]>(resource).then(setData).catch(console.error);
  }, [ufFilter]);

  if (!data) return <BarPorEditalSkeleton />;

  if (data.length === 0) {
    return (
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Comunidades por Edital</CardTitle>
          <CardDescription>
            Número de CTs por ano de edital
            {ufFilter && ufFilter !== "all" ? ` — Filtrado por ${ufFilter}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-[280px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Nenhum dado disponível.</p>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((acc, d) => acc + d.total, 0);

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle>Comunidades por Edital</CardTitle>
        <CardDescription>
          Número de CTs por ano de edital
          {ufFilter && ufFilter !== "all" ? ` — Filtrado por ${ufFilter}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ top: 24 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="edital" tickLine={false} axisLine={false} tick={{ fontSize: 13 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={500} animationEasing="ease-out">
              <LabelList position="top" offset={6} className="fill-foreground font-semibold" fontSize={12} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="h-4 w-4 shrink-0" />
        <span>
          Total de <strong className="text-foreground">{total}</strong> comunidades em todos os editais
        </span>
      </CardFooter>
    </Card>
  );
}
