"use client";

import CardsGroup from "@/components/dashboard-geral/cards-group";
import TabelaComunidades from "@/components/dashboard-geral/tabela-comunidades";
import Title from "@/components/Title";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SlidersHorizontal } from "lucide-react";
import dynamic from "next/dynamic";
import {
  Drawer, DrawerClose, DrawerContent, DrawerDescription,
  DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";

const BarPorUF            = dynamic(() => import("@/components/dashboard-geral/charts/bar-por-uf"),           { ssr: false, loading: () => <Skeleton className="h-[420px] w-full rounded-xl" /> });
const BarPorEdital        = dynamic(() => import("@/components/dashboard-geral/charts/bar-por-edital"),       { ssr: false, loading: () => <Skeleton className="h-[420px] w-full rounded-xl" /> });
const BarRecursoPorEdital = dynamic(() => import("@/components/dashboard-geral/charts/bar-recurso-edital"),   { ssr: false, loading: () => <Skeleton className="h-[420px] w-full rounded-xl" /> });
const AreaPagamentos      = dynamic(() => import("@/components/dashboard-geral/charts/area-pagamentos"),      { ssr: false, loading: () => <Skeleton className="h-[420px] w-full rounded-xl" /> });

function Filter() {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="default" size="sm">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filtros</DrawerTitle>
          <DrawerDescription>Selecione os filtros desejados</DrawerDescription>
        </DrawerHeader>
        <div className="p-4 flex flex-col gap-2">
          <Button variant="outline">Teste 1</Button>
          <Button variant="outline">Teste 2</Button>
          <Button variant="outline">Teste 3</Button>
          <Button variant="outline">Teste 4</Button>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="ghost">Fechar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default function Page() {
  return (
    <main>
      <Title
        title="Dashboard geral"
        subtitle="Visualização unificada dos dados"
        filterComponent={<Filter />}
      />

      <section className="dashboard-page p-4 flex gap-4 flex-col">
        {/* Cards de resumo */}
        <CardsGroup />

        {/* Linha 1: Barras UF (ocupa mais espaço) + Barras Edital */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <BarPorUF />
          <BarPorEdital />
        </div>
        {/* Linha 2: Recurso por Edital + Área de Pagamentos */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BarRecursoPorEdital />
          <AreaPagamentos />
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
