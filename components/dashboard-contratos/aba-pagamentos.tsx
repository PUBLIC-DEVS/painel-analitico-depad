"use client";

/**
 * Aba Pagamentos do setor Contratos — execução financeira mês a mês de 2025
 * (aba PAGAMENTOS da planilha). KPIs de orçamento + área dos valores pagos.
 */

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Wallet, BadgeDollarSign, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { GraficoCard } from "@/components/grafico-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { fBRL, fBRLShort } from "@/lib/formatters";
import type { PagamentosData } from "@/lib/dashboard-data";

const cfg = { valorPago: { label: "Valor pago", color: "var(--chart-2)" } } satisfies ChartConfig;

export default function AbaPagamentos() {
  const [data, setData] = useState<PagamentosData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/geral?resource=pagamentos")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[360px] w-full rounded-xl" />
      </div>
    );
  }

  const { orcamento, meses } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        <KpiCard icone={Wallet} rotulo="Orçamento anual" valor={fBRL(orcamento.anual)} />
        <KpiCard
          icone={BadgeDollarSign}
          rotulo="Total pago 2025"
          valor={fBRL(orcamento.totalPago)}
          sub={`${orcamento.pctExecutado}% do previsto`}
        />
        <KpiCard icone={TrendingUp} rotulo="Média mensal paga" valor={fBRL(orcamento.totalPago / 12)} />
      </div>

      <GraficoCard
        titulo="Pagamentos por mês (2025)"
        descricao="Valor repassado às comunidades mês a mês"
        arquivo="pagamentos-2025"
      >
        <ChartContainer config={cfg} className="h-[320px] w-full">
          <AreaChart accessibilityLayer data={meses} margin={{ top: 8, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={6} />
            <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={fBRLShort} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(v) => fBRL(Number(v))} />} />
            <Area
              dataKey="valorPago"
              type="monotone"
              stroke="var(--color-valorPago)"
              fill="var(--color-valorPago)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </GraficoCard>
    </div>
  );
}
