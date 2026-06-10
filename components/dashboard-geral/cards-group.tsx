import { BedDouble, User, Users, Baby, Wallet, Home, type LucideIcon } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import type { getStats } from "@/lib/dashboard-data";

type Stats = Awaited<ReturnType<typeof getStats>>;

const STATS: { key: keyof Stats; label: string; icon: LucideIcon }[] = [
  { key: "comunidadesTerapeuticas", label: "Comunidades", icon: Home },
  { key: "totalVagas", label: "Total de vagas", icon: BedDouble },
  { key: "vagasMasculinas", label: "Vagas masculinas", icon: User },
  { key: "vagasFemininas", label: "Vagas femininas", icon: Users },
  { key: "vagasParaMaes", label: "Vagas para mães", icon: Baby },
  { key: "orcamentoAnual", label: "Orçamento anual", icon: Wallet },
];

export default function CardsGroup({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
      {STATS.map(({ key, label, icon }) => (
        <KpiCard key={key} icone={icon} rotulo={label} valor={stats[key]} />
      ))}
    </div>
  );
}
