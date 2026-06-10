"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// react-simple-maps depende de APIs de browser → ssr:false (só permitido em
// componente client, por isso este wrapper). Fica fora do Suspense da página
// para não recarregar a cada troca de filtro — ele É o controle do filtro.
const MapaPorUf = dynamic(() => import("./mapa-por-uf"), {
  ssr: false,
  loading: () => <Skeleton className="h-[520px] w-full rounded-xl" />,
});

export default function MapaCard() {
  return <MapaPorUf />;
}
