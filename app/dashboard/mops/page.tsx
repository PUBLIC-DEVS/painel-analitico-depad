"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { Map as LeafletMap, LocationEvent } from "leaflet";
import { LatLng } from "leaflet";
import Title from "@/components/Title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapPoint } from "@/app/api/dashboard/contratos/route";
import { REGIOES } from "@/app/api/dashboard/contratos/route";

// ─── Fix Leaflet default icon (webpack apaga os paths em build) ───────────────
// Feito em um módulo isolado pra não quebrar SSR — só roda no client.
// Se já estiver corrigido globalmente no seu projeto, remova este bloco.
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet") as typeof import("leaflet");
  // @ts-expect-error — _getIconUrl não existe no tipo mas existe em runtime
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Filters {
  uf:       string;
  regiao:   string;
  vagasMin: string;
  vagasMax: string;
}

const REGIOES_LABELS: Record<string, string> = {
  norte:          "Norte",
  nordeste:       "Nordeste",
  "centro-oeste": "Centro-Oeste",
  sudeste:        "Sudeste",
  sul:            "Sul",
};

const UFS_BR = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA",
  "MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN",
  "RO","RR","RS","SC","SE","SP","TO",
];

// ─── Sub-component: fly to user location ─────────────────────────────────────

function LocationMarker() {
  const [position, setPosition] = useState<LatLng | null>(null);

  useMapEvents({
    click(e) {
      // Só localiza se clicar fora de um marker/popup
      if ((e.originalEvent.target as HTMLElement).closest(".leaflet-popup")) return;
      e.target.locate();
    },
    locationfound(e: LocationEvent) {
      setPosition(e.latlng);
      e.target.flyTo(e.latlng, e.target.getZoom());
    },
  });

  if (!position) return null;

  return (
    <Marker position={position}>
      <Popup>Você está aqui</Popup>
    </Marker>
  );
}

// ─── Sub-component: popup content ────────────────────────────────────────────

function ComunidadePopup({ point }: { point: MapPoint }) {
  function handleDetalhes() {
    // TODO: implemente a navegação para a página de detalhes da comunidade.
    // Sugestão: router.push(`/contratos/${encodeURIComponent(point.id)}`)
    // ou abrir um Sheet/Dialog lateral com os dados completos.
    console.log("Navegar para detalhes de:", point.id);
  }

  return (
    <div className="font-sans min-w-[200px]">
      <strong className="block text-sm leading-snug mb-1">
        {point.nome_fantasia || point.nome}
      </strong>
      {point.nome_fantasia && (
        <span className="block text-xs text-gray-500 mb-2">{point.nome}</span>
      )}

      <dl className="text-xs space-y-0.5 mb-3">
        <div className="flex gap-1">
          <dt className="text-gray-500 shrink-0">CNPJ</dt>
          <dd className="font-mono">{point.cnpj || "—"}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-gray-500 shrink-0">Localidade</dt>
          <dd>{point.cidade ? `${point.cidade} / ${point.uf}` : point.uf || "—"}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-gray-500 shrink-0">Status</dt>
          <dd>{point.status_ct || "—"}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-gray-500 shrink-0">Recurso/mês</dt>
          <dd>{point.recurso_mensal || "—"}</dd>
        </div>

        {/* Vagas */}
        <div className="pt-1 border-t border-gray-100 mt-1">
          <dt className="text-gray-500 mb-0.5">Vagas contratadas</dt>
          <dd className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span>
              Total:{" "}
              <strong>{point.vagas_contratadas}</strong>
            </span>
            <span>
              Masc.:{" "}
              <strong>{point.adulto_masc}</strong>
            </span>
            <span>
              Fem.:{" "}
              <strong>{point.adulto_feminino}</strong>
            </span>
            <span>
              Mães:{" "}
              <strong>{point.maes}</strong>
            </span>
          </dd>
        </div>
      </dl>

      <button
        onClick={handleDetalhes}
        className="w-full text-xs text-center rounded border border-gray-300 px-2 py-1 hover:bg-gray-50 transition-colors"
      >
        Mais detalhes →
      </button>
    </div>
  );
}

// ─── Sub-component: filter sidebar ───────────────────────────────────────────

interface FilterPanelProps {
  filters:    Filters;
  onChange:   (f: Filters) => void;
  total:      number;
  loading:    boolean;
}

function FilterPanel({ filters, onChange, total, loading }: FilterPanelProps) {
  function set(key: keyof Filters, value: string) {
    // UF e região são mutuamente exclusivos — limpa o outro
    if (key === "uf" && value !== "all") {
      onChange({ ...filters, uf: value, regiao: "all" });
    } else if (key === "regiao" && value !== "all") {
      onChange({ ...filters, regiao: value, uf: "all" });
    } else {
      onChange({ ...filters, [key]: value });
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 px-4 py-3 border-b bg-card">
      {/* UF */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">UF</Label>
        <Select value={filters.uf} onValueChange={(v) => set("uf", v)}>
          <SelectTrigger className="h-8 w-24 text-xs">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {UFS_BR.map((uf) => (
              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Região */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Região</Label>
        <Select value={filters.regiao} onValueChange={(v) => set("regiao", v)}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(REGIOES_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vagas mín */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Vagas (mín)</Label>
        <Input
          type="number"
          min={0}
          placeholder="0"
          value={filters.vagasMin}
          onChange={(e) => set("vagasMin", e.target.value)}
          className="h-8 w-20 text-xs"
        />
      </div>

      {/* Vagas máx */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Vagas (máx)</Label>
        <Input
          type="number"
          min={0}
          placeholder="∞"
          value={filters.vagasMax}
          onChange={(e) => set("vagasMax", e.target.value)}
          className="h-8 w-20 text-xs"
        />
      </div>

      {/* Contador */}
      <span className="text-xs text-muted-foreground pb-1 ml-auto">
        {loading ? "Carregando…" : `${total} comunidade${total !== 1 ? "s" : ""}`}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MapaPage() {
  const [points,  setPoints]  = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    uf:       "all",
    regiao:   "all",
    vagasMin: "",
    vagasMax: "",
  });

  // Filtra client-side — evita re-fetch por cada mudança de filtro.
  // Os params também são suportados pelo route para filtrar server-side se necessário.
  const [allPoints, setAllPoints] = useState<MapPoint[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/dashboard/contratos?resource=mapa")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<MapPoint[]>;
      })
      .then((data) => {
        setAllPoints(data);
        setPoints(data);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Aplica filtros client-side sempre que filters ou allPoints mudam
  useEffect(() => {
    const { uf, regiao, vagasMin, vagasMax } = filters;
    const min = vagasMin !== "" ? Number(vagasMin) : 0;
    const max = vagasMax !== "" ? Number(vagasMax) : Infinity;

    const ufsRegiao =
      regiao !== "all" ? new Set(REGIOES[regiao] ?? []) : null;

    setPoints(
      allPoints.filter((p) => {
        if (uf !== "all" && p.uf !== uf) return false;
        if (!uf || uf === "all") {
          if (ufsRegiao && !ufsRegiao.has(p.uf)) return false;
        }
        if (p.vagas_contratadas < min) return false;
        if (p.vagas_contratadas > max) return false;
        return true;
      }),
    );
  }, [filters, allPoints]);

  return (
    <main className="flex flex-col h-full">

      <FilterPanel
        filters={filters}
        onChange={setFilters}
        total={points.length}
        loading={loading}
      />

      <section className="flex-1 min-h-0 isolate relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/60">
            <Skeleton className="h-10 w-48 rounded-full" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center">
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Erro ao carregar: {error}
            </p>
          </div>
        )}

        <MapContainer
          center={[-15.7801, -47.9292]}
          zoom={4}
          touchZoom
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocationMarker />

          {points.map((point) => (
            <Marker
              key={point.id}
              position={[point.lat, point.lng] as [number, number]}
            >
              <Popup minWidth={220} maxWidth={280}>
                <ComunidadePopup point={point} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </section>
    </main>
  );
}