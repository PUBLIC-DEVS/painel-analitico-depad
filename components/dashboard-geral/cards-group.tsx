"use client";

import { useEffect, useState } from "react";
import {
  BedDouble,
  User,
  Users,
  Baby,
  Wallet,
  FileText,
  Home,
} from "lucide-react";

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
    <div className="flex flex-1 flex-col gap-0.5 rounded-lg border border-border bg-card px-4 py-3 min-w-56">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon && (
          <span className="flex items-center justify-center text-muted-foreground">
            {icon}
          </span>
        )}
      </div>
      <span className="text-xl font-semibold tracking-tight text-card-foreground">
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
const STATS_CONFIG = [
  { label: "Total de Vagas",           icon: <BedDouble size={16} /> },
  { label: "Vagas Masculinas",         icon: <User size={16} /> },
  { label: "Vagas Femininas",          icon: <Users size={16} /> },
  { label: "Vagas para Mães",          icon: <Baby size={16} /> },
  { label: "Orçamento Anual",          icon: <Wallet size={16} /> },
  { label: "Contratos Registrados",    icon: <FileText size={16} /> },
  { label: "Comunidades Terapêuticas", icon: <Home size={16} /> },
];

type StatsData = {
  totalVagas: number;
  vagasMasculinas: number;
  vagasFemininas: number;
  vagasMaes: number;
  orcamentoAnual: string;
  contratosRegistrados: number;
  comunidadesTerapeuticas: number;
};

async function fetchStats(): Promise<StatsData> {
  // Substitua por fetch real quando a API estiver pronta.
  // Exemplo: const res = await fetch("/api/stats"); return res.json();
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          totalVagas: 1_240,
          vagasMasculinas: 780,
          vagasFemininas: 380,
          vagasMaes: 80,
          orcamentoAnual: "R$ 4.800.000,00",
          contratosRegistrados: 312,
          comunidadesTerapeuticas: 97,
        }),
      1_800,
    ),
  );
}

export default function CardsGroup() {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    fetchStats().then(setData);
  }, []);

  const values = data
    ? [
        data.totalVagas,
        data.vagasMasculinas,
        data.vagasFemininas,
        data.vagasMaes,
        data.orcamentoAnual,
        data.contratosRegistrados,
        data.comunidadesTerapeuticas,
      ]
    : [];

  return (
    <div className="flex flex-wrap gap-4">
      {STATS_CONFIG.map((cfg, i) =>
        data ? (
          <Card
            key={cfg.label}
            label={cfg.label}
            value={values[i]}
            icon={cfg.icon}
          />
        ) : (
          <CardSkeleton key={cfg.label} />
        ),
      )}
    </div>
  );
}