import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * Card de indicador (KPI) padrão do painel: acento lateral, ícone em chip e
 * número grande. Fonte única — antes estava duplicado em cada seção.
 */
export function KpiCard({
  icone: Icone,
  rotulo,
  valor,
  sub,
}: {
  icone: LucideIcon;
  rotulo: string;
  valor: string | number;
  sub?: string;
}) {
  return (
    <Card className="relative gap-0 p-3 transition-shadow duration-200 hover:shadow-md">
      <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-primary to-primary/20" />
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {rotulo}
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icone className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-1.5 truncate text-2xl font-bold tracking-tight tabular-nums">{valor}</div>
      {sub && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</div>}
    </Card>
  );
}
