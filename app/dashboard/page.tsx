/**
 * Dashboard geral — visão consolidada dos contratos das CTs.
 *
 * Fetch "do jeito do Next": esta página é um Server Component assíncrono. Cada
 * bloco é um Server Component que busca seus dados (lib/dashboard-data, com cache
 * de 1h) e fica dentro de um <Suspense> — o skeleton aparece sozinho enquanto a
 * seção carrega/streama. O filtro por UF vive na URL (?uf=XX): o mapa escreve lá
 * e essas seções, com key={uf}, re-suspendem e recarregam só elas.
 */

import { Suspense } from "react";
import { getStats, getPorEdital, getRecursoPorEdital } from "@/lib/dashboard-data";
import CardsGroup from "@/components/dashboard-geral/cards-group";
import BarPorEdital from "@/components/dashboard-geral/bar-por-edital";
import BarRecursoEdital from "@/components/dashboard-geral/bar-recurso-edital";
import MapaCard from "@/components/dashboard-geral/mapa-card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function DashboardGeral({
  searchParams,
}: {
  searchParams: Promise<{ uf?: string }>;
}) {
  const { uf = "all" } = await searchParams;

  return (
    <section className="h-full overflow-y-auto overscroll-contain">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Dashboard geral</h1>
          <p className="text-sm text-muted-foreground">
            Visão consolidada dos contratos, distribuição regional e execução financeira.
          </p>
        </div>

        <Suspense key={`cards-${uf}`} fallback={<CardsSkeleton />}>
          <SecaoCards uf={uf} />
        </Suspense>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
          <MapaCard />
          <Suspense key={`edital-${uf}`} fallback={<GraficoSkeleton />}>
            <SecaoEdital uf={uf} />
          </Suspense>
        </div>

        <Suspense key={`recurso-${uf}`} fallback={<GraficoSkeleton />}>
          <SecaoRecurso uf={uf} />
        </Suspense>
      </div>
    </section>
  );
}

/* ── seções (Server Components: buscam e entregam pros componentes de UI) ── */

async function SecaoCards({ uf }: { uf: string }) {
  return <CardsGroup stats={await getStats(uf)} />;
}

async function SecaoEdital({ uf }: { uf: string }) {
  return <BarPorEdital data={await getPorEdital(uf)} uf={uf} />;
}

async function SecaoRecurso({ uf }: { uf: string }) {
  return <BarRecursoEdital data={await getRecursoPorEdital(uf)} uf={uf} />;
}

/* ── fallbacks de loading ── */

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-18 rounded-xl" />
      ))}
    </div>
  );
}

function GraficoSkeleton() {
  return <Skeleton className="h-90 w-full rounded-xl" />;
}
