"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { fetchDashboard } from "@/lib/dashboard-cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface UFEntry {
  uf: string;
  total: number;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function BarPorUFSkeleton() {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-6 shrink-0" />
            <Skeleton className="h-5 rounded" style={{ width: `${Math.max(15, 90 - i * 7)}%` }} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Chart config
// ---------------------------------------------------------------------------
const chartConfig = {
  total: { label: "Comunidades", color: "var(--primary)" },
} satisfies ChartConfig;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function BarPorUF() {
  const [data, setData] = useState<UFEntry[] | null>(null);

  useEffect(() => {
    fetchDashboard<UFEntry[]>("uf").then(setData).catch(console.error);
  }, []);

  if (!data) return <BarPorUFSkeleton />;

  if (data.length === 0) {
    return (
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Comunidades por UF</CardTitle>
          <CardDescription>Número de CTs registradas por estado</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[420px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Nenhum dado disponível.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle>Comunidades por UF</CardTitle>
        <CardDescription>Número de CTs registradas por estado</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[420px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 40, top: 0, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="uf"
              type="category"
              tickLine={false}
              axisLine={false}
              width={28}
              tick={{ fontSize: 12 }}
            />
            <XAxis dataKey="total" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar
              dataKey="total"
              fill="var(--color-total)"
              radius={4}
              isAnimationActive
              animationDuration={350}
              animationEasing="ease-out"
              animationBegin={0}
            >
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
      </CardContent>
    </Card>
  );
}
