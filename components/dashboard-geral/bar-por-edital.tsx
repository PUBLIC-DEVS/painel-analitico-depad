"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { GraficoCard } from "@/components/grafico-card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface EditalEntry {
  edital: string;
  total: number;
}

const chartConfig = { total: { label: "Comunidades", color: "var(--chart-1)" } } satisfies ChartConfig;

export default function BarPorEdital({ data, uf = "all" }: { data: EditalEntry[]; uf?: string }) {
  return (
    <GraficoCard
      titulo="Comunidades por edital"
      descricao={`Número de CTs por ano de edital${uf !== "all" ? ` — ${uf}` : ""}`}
      arquivo="comunidades-por-edital"
    >
      {data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          Nenhum dado disponível.
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ top: 24 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="edital" tickLine={false} axisLine={false} tickMargin={6} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]}>
              <LabelList position="top" offset={6} className="fill-foreground text-[11px] font-medium tabular-nums" />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </GraficoCard>
  );
}
