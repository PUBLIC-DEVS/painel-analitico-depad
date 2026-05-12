"use client";

import CardsGroup from "@/components/dashboard-geral/cards-group";
import TabelaComunidades from "@/components/dashboard-geral/tabela-comunidades";
import Title from "@/components/Title";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const BarPorUF            = dynamic(() => import("@/components/dashboard-geral/charts/bar-por-uf"),           { ssr: false, loading: () => <Skeleton className="h-[420px] w-full rounded-xl" /> });
const BarPorEdital        = dynamic(() => import("@/components/dashboard-geral/charts/bar-por-edital"),       { ssr: false, loading: () => <Skeleton className="h-[420px] w-full rounded-xl" /> });
const BarRecursoPorEdital = dynamic(() => import("@/components/dashboard-geral/charts/bar-recurso-edital"),   { ssr: false, loading: () => <Skeleton className="h-[420px] w-full rounded-xl" /> });

export default function Page() {
  return (
    <main>
      <Title
        title="Dashboard geral"
        subtitle="Visão consolidada dos contratos, distribuição regional e execução financeira."
      />

      <section className="dashboard-page mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 pb-8">
        {/* Cards de resumo */}
        <CardsGroup />

        {/* Linha 1: Barras UF (ocupa mais espaço) + Barras Edital */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
          <BarPorUF />
          <BarPorEdital />
        </div>
        {/* Linha 2: Recurso por Edital + Área de Pagamentos */}
        <div className="grid grid-cols-1 gap-4">
          <BarRecursoPorEdital />
        </div>

        {/* Tabela completa */}
        <TabelaComunidades />
        {/*
          Para popular a tabela, passe os dados reais:
          <TabelaComunidades data={comunidades} />

          Onde `comunidades` é um Comunidade[] vindo de um fetch, por exemplo:
          const comunidades = await fetch("/api/comunidades").then(r => r.json())
        */}
      </section>
    </main>
  );
}
