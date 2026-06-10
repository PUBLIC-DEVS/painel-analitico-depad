"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { GraficoCard } from "@/components/grafico-card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { fBRL, fBRLShort } from "@/lib/formatters";

interface RecursoEntry {
  edital: string;
  total: number;
}

const chartConfig = { total: { label: "Recurso anual", color: "var(--chart-2)" } } satisfies ChartConfig;

export default function BarRecursoEdital({ data, uf = "all" }: { data: RecursoEntry[]; uf?: string }) {
  return (
    <GraficoCard
      titulo="Recurso anual por edital"
      descricao={`Previsão total de recurso por ano de edital${uf !== "all" ? ` — ${uf}` : ""}`}
      arquivo="recurso-por-edital"
    >
      {data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          Nenhum dado disponível.
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="edital" tickLine={false} axisLine={false} tickMargin={6} />
            <YAxis tickLine={false} axisLine={false} width={72} tickFormatter={fBRLShort} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(v) => fBRL(Number(v))} />} />
            <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      )}
    </GraficoCard>
  );
}
