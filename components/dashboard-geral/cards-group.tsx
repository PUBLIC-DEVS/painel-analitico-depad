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
    <div className="flex h-full min-w-0 flex-col gap-2 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
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
    <div className="flex h-full min-w-0 flex-col gap-2 rounded-xl border border-border/70 bg-card px-4 py-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
        {icon && (
          <span className="flex items-center justify-center text-primary/80">
            {icon}
          </span>
        )}
      </div>
      <span className="text-2xl font-semibold tracking-tight text-foreground">
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
  vagasParaMaes:           number;
  orcamentoAnual:          string;
  contratosRegistrados:    number;
  comunidadesTerapeuticas: number;
};

const STATS_CONFIG = [
  { key: "totalVagas"              as const, label: "Total de Vagas",           icon: <BedDouble size={16} /> },
  { key: "vagasMasculinas"         as const, label: "Vagas Masculinas",          icon: <User      size={16} /> },
  { key: "vagasFemininas"          as const, label: "Vagas Femininas",           icon: <Users     size={16} /> },
  { key: "vagasParaMaes"           as const, label: "Vagas para Mães",           icon: <Baby      size={16} /> },
  { key: "orcamentoAnual"          as const, label: "Orçamento Anual",           icon: <Wallet    size={16} /> },
  { key: "contratosRegistrados"    as const, label: "Contratos Registrados",     icon: <FileText  size={16} /> },
  { key: "comunidadesTerapeuticas" as const, label: "Comunidades Terapêuticas",  icon: <Home      size={16} /> },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CardsGroup({ ufFilter }: { ufFilter?: string }) {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    const resource = ufFilter && ufFilter !== "all" ? `stats&uf=${ufFilter}` : "stats";
    fetchDashboard<StatsData>(resource).then(setData).catch(console.error);
  }, [ufFilter]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
