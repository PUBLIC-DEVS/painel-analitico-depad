"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { GraficoCard } from "@/components/grafico-card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const cfg = { total: { label: "Propostas", color: "var(--chart-3)" } } satisfies ChartConfig;

export interface DadoBarra {
  rotulo: string;
  total: number;
}

/**
 * Barra reutilizável das quebras de Repasses (partido, situação, modalidade,
 * secretaria). `horizontal` pra quando há muitas categorias ou rótulos longos.
 */
export function BarRepasses({
  titulo,
  descricao,
  arquivo,
  dados,
  horizontal = false,
}: {
  titulo: string;
  descricao?: string;
  arquivo: string;
  dados: DadoBarra[];
  horizontal?: boolean;
}) {
  return (
    <GraficoCard titulo={titulo} descricao={descricao} arquivo={arquivo}>
      {dados.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          Sem dados.
        </div>
      ) : (
        <ChartContainer config={cfg} className="h-[300px] w-full">
          {horizontal ? (
            <BarChart accessibilityLayer data={dados} layout="vertical" margin={{ left: 6, right: 30 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="rotulo"
                tickLine={false}
                axisLine={false}
                width={130}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="total" position="right" offset={6} className="fill-foreground text-[11px] tabular-nums" />
              </Bar>
            </BarChart>
          ) : (
            <BarChart accessibilityLayer data={dados} margin={{ top: 20 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tickMargin={6} tick={{ fontSize: 11 }} interval={0} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]}>
                <LabelList position="top" offset={6} className="fill-foreground text-[11px] font-medium tabular-nums" />
              </Bar>
            </BarChart>
          )}
        </ChartContainer>
      )}
    </GraficoCard>
  );
}
