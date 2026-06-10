"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboard } from "@/lib/dashboard-cache";

const geoUrl =
  "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

interface UFEntry {
  uf: string;
  total: number;
}

// Centróides para posicionar o número de cada estado.
const CENTROIDES: Record<string, [number, number]> = {
  AC: [-70.55, -9.02], AL: [-36.38, -9.53], AM: [-64.62, -4.22], AP: [-51.95, 1.41],
  BA: [-41.7, -12.5], CE: [-39.32, -5.49], DF: [-47.86, -15.83], ES: [-40.3, -19.18],
  GO: [-49.8, -16.0], MA: [-45.27, -4.96], MG: [-44.28, -18.51], MS: [-54.62, -20.51],
  MT: [-55.0, -13.0], PA: [-52.93, -3.97], PB: [-36.17, -7.11], PE: [-37.65, -8.81],
  PI: [-42.72, -7.71], PR: [-51.99, -25.25], RJ: [-43.15, -22.9], RN: [-36.65, -5.79],
  RO: [-62.8, -10.9], RR: [-60.75, 2.73], RS: [-53.0, -29.5], SC: [-50.2, -27.24],
  SE: [-37.38, -10.59], SP: [-48.64, -22.19], TO: [-48.36, -10.17],
};

function MapaSkeleton() {
  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-1 h-4 w-64" />
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center">
        <Skeleton className="h-[420px] w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

export default function MapaPorUf() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeUf = params.get("uf") ?? "all";

  const [data, setData] = useState<UFEntry[] | null>(null);
  const [tooltip, setTooltip] = useState("");

  // Os dados do mapa são do país inteiro (não mudam com o filtro): busca 1x.
  useEffect(() => {
    fetchDashboard<UFEntry[]>("uf").then(setData).catch(console.error);
  }, []);

  const escala = useMemo(() => {
    const max = data?.length ? Math.max(...data.map((d) => d.total)) : 0;
    return scaleLinear<string>().domain([0, max]).range(["#dbeafe", "#1e3a8a"]);
  }, [data]);

  // Clicar numa UF põe ?uf=XX na URL; clicar de novo (ou fora) limpa. A troca de
  // searchParams faz os Server Components (cards/gráficos) re-renderizarem.
  const selecionar = (sigla: string) => {
    const proximo = sigla === "all" || activeUf === sigla ? "" : sigla;
    router.push(proximo ? `${pathname}?uf=${proximo}` : pathname, { scroll: false });
  };

  if (!data) return <MapaSkeleton />;

  return (
    <Card className="relative flex h-full min-w-0 flex-col">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle>Comunidades por UF</CardTitle>
          {activeUf !== "all" && (
            <Badge className="flex cursor-pointer items-center gap-1.5" onClick={() => selecionar("all")}>
              Filtro: {activeUf}
              <X size={12} className="opacity-70" />
            </Badge>
          )}
        </div>
        <CardDescription>Número de CTs registradas por estado</CardDescription>
      </CardHeader>

      <CardContent className="relative flex flex-1 flex-col items-center justify-center pt-2">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 850, center: [-54, -15] }}
          style={{ width: "100%", height: 420 }}
          onClick={() => selecionar("all")}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const sigla = geo.properties.sigla as string;
                const valor = data.find((d) => d.uf === sigla)?.total ?? 0;
                const ativo = activeUf === sigla;
                const apagado = activeUf !== "all" && !ativo;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={valor > 0 ? escala(valor) : "#f1f5f9"}
                    stroke={ativo ? "#dc2626" : "#ffffff"}
                    strokeWidth={ativo ? 2.5 : 0.5}
                    style={{
                      default: { outline: "none", transition: "all 250ms", opacity: apagado ? 0.2 : 1 },
                      hover: { fill: "#2563eb", outline: "none", cursor: "pointer", opacity: apagado ? 0.6 : 0.9 },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={() => setTooltip(`${geo.properties.name}: ${valor} comunidade${valor !== 1 ? "s" : ""}`)}
                    onMouseLeave={() => setTooltip("")}
                    onClick={(e) => {
                      e.stopPropagation();
                      selecionar(sigla);
                    }}
                  />
                );
              })
            }
          </Geographies>

          {data
            .filter((d) => d.total > 0)
            .map((d) => {
              const centro = CENTROIDES[d.uf];
              if (!centro) return null;
              const apagado = activeUf !== "all" && activeUf !== d.uf;
              return (
                <Marker key={d.uf} coordinates={centro}>
                  <text
                    textAnchor="middle"
                    y={4}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      fill: "#ffffff",
                      pointerEvents: "none",
                      textShadow: "0px 1px 3px rgba(0,0,0,0.9)",
                      opacity: apagado ? 0.3 : 1,
                      transition: "opacity 250ms",
                    }}
                  >
                    {d.total}
                  </text>
                </Marker>
              );
            })}

          {/* DF é pequeno demais pro número caber dentro — puxa num balão à direita. */}
          <Marker coordinates={[-47.86, -15.83]}>
            <line x1="0" y1="0" x2="160" y2="0" stroke={activeUf === "DF" ? "#dc2626" : "#1e3a8a"} strokeWidth={1} strokeDasharray="3 2" />
            <circle
              r={4}
              fill={activeUf === "DF" ? "#dc2626" : "#1e3a8a"}
              stroke="#fff"
              strokeWidth={1.5}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                selecionar("DF");
              }}
            />
            <text
              x="165"
              y="0"
              dominantBaseline="middle"
              className="cursor-pointer select-none"
              style={{ fontSize: 12, fontWeight: 700, fill: activeUf === "DF" ? "#dc2626" : "#1e3a8a" }}
              onClick={(e) => {
                e.stopPropagation();
                selecionar("DF");
              }}
            >
              DF
            </text>
          </Marker>
        </ComposableMap>

        {tooltip && (
          <div className="pointer-events-none absolute right-4 top-4 rounded-lg border bg-card/95 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur">
            {tooltip}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
