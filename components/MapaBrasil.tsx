"use client";

/**
 * MapaBrasil — mapa Leaflet das comunidades terapêuticas com coordenadas reais.
 *
 *  - pontos vêm de /api/dashboard/geral?resource=mapa (planilha de geolocalização,
 *    ~600 comunidades de 2024/2025 com lat/long validados dentro do Brasil);
 *  - clustering (react-leaflet-cluster) agrupa o que está fora de foco e aguenta
 *    milhares de markers sem travar;
 *  - painel lateral (shadcn Card) abre ao clicar num ponto e mostra os dados da CT;
 *  - tiles claro/escuro acompanham o next-themes.
 *
 * Importar com dynamic(..., { ssr: false }) — Leaflet depende de `window`.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L, { LatLngBoundsExpression } from "leaflet";
import { useTheme } from "next-themes";
import { X, Users, MapPin, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboard } from "@/lib/dashboard-cache";
import type { PontoComunidade } from "@/lib/dashboard-data";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";

const CENTRO_BRASIL: [number, number] = [-14.235, -51.925];
const ZOOM_GERAL = 4;
const LIMITES_BRASIL: LatLngBoundsExpression = [
  [-34, -74],
  [6, -34],
];
const LARGURA_PAINEL = 340; // px

const TILES = {
  light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};
const ATRIBUICAO = "&copy; OpenStreetMap &copy; CARTO";

/** Ícone do ponto via CDN (evita ícone quebrado no bundler do Next). */
const icone = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function criarClusterIcon(cluster: { getChildCount: () => number }) {
  const total = cluster.getChildCount();
  return L.divIcon({
    html: `<span>${total}</span>`,
    className:
      "flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold ring-4 ring-primary/30",
    iconSize: L.point(36, 36),
  });
}

// Pontos + clustering (dentro do MapContainer p/ usar useMap)
function Pontos({
  pontos,
  aoSelecionar,
}: {
  pontos: PontoComunidade[];
  aoSelecionar: (p: PontoComunidade) => void;
}) {
  const map = useMap();

  const focar = (p: PontoComunidade) => {
    aoSelecionar(p);
    const zoom = 8;
    const alvo = map.project([p.lat, p.lng], zoom).add([LARGURA_PAINEL / 2, 0]);
    map.setView(map.unproject(alvo, zoom), zoom, { animate: true });
  };

  return (
    // maxClusterRadius baixo + disableClusteringAtZoom: os marcadores individuais
    // aparecem cedo (zoom regional), sem precisar chegar tão perto.
    <MarkerClusterGroup
      chunkedLoading
      iconCreateFunction={criarClusterIcon}
      maxClusterRadius={45}
      disableClusteringAtZoom={6}
      spiderfyOnMaxZoom
      showCoverageOnHover={false}
    >
      {pontos.map((p, i) => (
        <Marker
          key={`${p.cnpj}-${i}`}
          position={[p.lat, p.lng]}
          icon={icone}
          eventHandlers={{ click: () => focar(p) }}
        />
      ))}
    </MarkerClusterGroup>
  );
}

function LinhaInfo({ rotulo, valor }: { rotulo: string; valor: string }) {
  if (!valor) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{rotulo}</span>
      <span className="text-sm">{valor}</span>
    </div>
  );
}

export default function MapaBrasil() {
  const [pontos, setPontos] = useState<PontoComunidade[] | null>(null);
  const [selecionado, setSelecionado] = useState<PontoComunidade | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    fetchDashboard<PontoComunidade[]>("mapa").then(setPontos).catch(console.error);
  }, []);

  const tileUrl = resolvedTheme === "dark" ? TILES.dark : TILES.light;
  const aberto = selecionado !== null;

  const fechar = () => {
    setSelecionado(null);
    mapRef.current?.setView(CENTRO_BRASIL, ZOOM_GERAL, { animate: true });
  };

  if (!pontos) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden isolate">
      {/* contador discreto de comunidades plotadas */}
      <div className="absolute left-3 top-3 z-1000 rounded-md bg-card/95 px-3 py-1.5 text-xs font-medium shadow-sm ring-1 ring-foreground/10 backdrop-blur">
        {pontos.length} comunidades no mapa
      </div>

      <MapContainer
        ref={mapRef}
        center={CENTRO_BRASIL}
        zoom={ZOOM_GERAL}
        minZoom={ZOOM_GERAL}
        maxBounds={LIMITES_BRASIL}
        maxBoundsViscosity={1}
        preferCanvas
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer key={resolvedTheme} url={tileUrl} attribution={ATRIBUICAO} />
        <Pontos pontos={pontos} aoSelecionar={setSelecionado} />
      </MapContainer>

      <aside
        className={`absolute right-0 top-0 z-1100 h-full transition-transform duration-300 ${
          aberto ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: LARGURA_PAINEL }}
      >
        <Card className="h-full rounded-none border-0 border-l shadow-xl">
          <CardHeader className="flex flex-row items-start justify-between gap-2 border-b">
            <CardTitle className="text-base leading-snug">{selecionado?.entidade}</CardTitle>
            <Button variant="ghost" size="icon" onClick={fechar} aria-label="Fechar" className="shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-semibold tabular-nums">{selecionado?.vagas ?? 0}</span>
              <span className="text-muted-foreground">vagas contratadas</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>
                {[selecionado?.cidade, selecionado?.uf].filter(Boolean).join(" — ")}
              </span>
            </div>
            <LinhaInfo rotulo="Contrato" valor={selecionado?.contrato ?? ""} />
            <LinhaInfo rotulo="CNPJ" valor={selecionado?.cnpj ?? ""} />

            {selecionado && (
              <Button asChild size="sm" className="mt-1 w-full gap-1.5">
                <Link href={`/dashboard/comunidade/${selecionado.cnpj.replace(/\D/g, "")}`}>
                  Ver mais
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
