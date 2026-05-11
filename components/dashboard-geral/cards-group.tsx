"use client";

import { useEffect, useState } from "react";
import {
  BedDouble, User, Users, Baby, Wallet, FileText, Home,
} from "lucide-react";
import { fetchDashboard } from "@/lib/dashboard-cache";

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function CardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-0.5 rounded-lg border border-border bg-card px-4 py-3 min-w-56">
      <div className="flex items-center justify-between">
        <span className="h-3 w-28 animate-pulse rounded bg-muted" />
        <span className="h-4 w-4 animate-pulse rounded bg-muted" />
      </div>
      <span className="mt-1 h-6 w-20 animate-pulse rounded bg-muted" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
interface CardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

function Card({ label, value, icon }: CardProps) {
  return (
    <div className="flex flex-1 flex-col gap-1 rounded-xl border border-border/60 bg-card px-5 py-4 min-w-56 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-primary">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {icon && (
          <span className="flex items-center justify-center text-primary/80">
            {icon}
          </span>
        )}
      </div>
      <span className="text-2xl font-bold tracking-tight text-foreground">
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Types + config
// ---------------------------------------------------------------------------
type StatsData = {
  totalVagas:              number;
  vagasMasculinas:         number;
  vagasFemininas:          number;
  vagasMaes:               number;
  orcamentoAnual:          string;
  contratosRegistrados:    number;
  comunidadesTerapeuticas: number;
};

const STATS_CONFIG = [
  { key: "totalVagas"              as const, label: "Total de Vagas",           icon: <BedDouble size={16} /> },
  { key: "vagasMasculinas"         as const, label: "Vagas Masculinas",          icon: <User      size={16} /> },
  { key: "vagasFemininas"          as const, label: "Vagas Femininas",           icon: <Users     size={16} /> },
  { key: "vagasMaes"               as const, label: "Vagas para Mães",           icon: <Baby      size={16} /> },
  { key: "orcamentoAnual"          as const, label: "Orçamento Anual",           icon: <Wallet    size={16} /> },
  { key: "contratosRegistrados"    as const, label: "Contratos Registrados",     icon: <FileText  size={16} /> },
  { key: "comunidadesTerapeuticas" as const, label: "Comunidades Terapêuticas",  icon: <Home      size={16} /> },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CardsGroup() {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    fetchDashboard<StatsData>("stats").then(setData).catch(console.error);
  }, []);

  return (
    <div className="flex flex-wrap gap-4">
      {STATS_CONFIG.map((cfg) =>
        data ? (
          <Card key={cfg.key} label={cfg.label} value={data[cfg.key]} icon={cfg.icon} />
        ) : (
          <CardSkeleton key={cfg.key} />
        )
      )}
    </div>
  );
}