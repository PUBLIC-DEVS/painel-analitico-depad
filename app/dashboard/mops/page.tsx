"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import type { LocationEvent } from "leaflet";
import { LatLng } from "leaflet";
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
import type { MapPoint } from "@/app/api/dashboard/contratos/_types";
import { REGIOES } from "@/app/api/dashboard/contratos/_fetchers";
import { useRouter } from "next/navigation";

// ─── Fix Leaflet default icon ─────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Chave React garantidamente única: dígitos do CNPJ + dígitos do contrato_ano */
function pointKey(point: MapPoint): string {
  return (
    point.cnpj.replace(/\D/g, "") +
    point.contrato_ano.replace(/\D/g, "")
  );
}

/** CNPJ limpo (só dígitos) usado como parâmetro de rota */
function cnpjParam(point: MapPoint): string {
  return point.cnpj.replace(/\D/g, "");
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

// ─── LocationMarker ───────────────────────────────────────────────────────────

function LocationMarker() {
  const [position, setPosition] = useState<LatLng | null>(null);

  useMapEvents({
    click(e) {
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

// ─── ComunidadePopup ──────────────────────────────────────────────────────────

function ComunidadePopup({ point }: { point: MapPoint }) {
  const router = useRouter();

  function handleDetalhes() {
    // Navega pelo CNPJ (só dígitos) — mesmo parâmetro que a página de detalhe espera
    router.push(`/dashboard/comunidade/${cnpjParam(point)}`);
  }

  return (
    <div className="font-sans min-w-[200px]">
      <strong className="block text-sm leading-snug mb-0.5">
        {point.nome_fantasia || point.nome}
      </strong>
      {point.nome_fantasia && (
        <span className="block text-xs text-gray-500 mb-1">{point.nome}</span>
      )}
      <span className="block text-xs text-gray-400 mb-2">
        Contrato: {point.contrato_ano}
      </span>

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

        <div className="pt-1 border-t border-gray-100 mt-1">
          <dt className="text-gray-500 mb-0.5">Vagas contratadas</dt>
          <dd className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span>Total: <strong>{point.vagas_contratadas}</strong></span>
            <span>Masc.: <strong>{point.adulto_masc}</strong></span>
            <span>Fem.: <strong>{point.adulto_feminino}</strong></span>
            <span>Mães: <strong>{point.maes}</strong></span>
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

// ─── FilterPanel ──────────────────────────────────────────────────────────────

interface FilterPanelProps {
  filters:  Filters;
  onChange: (f: Filters) => void;
  total:    number;
  loading:  boolean;
}

function FilterPanel({ filters, onChange, total, loading }: FilterPanelProps) {
  function set(key: keyof Filters, value: string) {
    if (key === "uf" && value !== "all") {
      onChange({ ...filters, uf: value, regiao: "all" });
    } else if (key === "regiao" && value !== "all") {
      onChange({ ...filters, regiao: value, uf: "all" });
    } else {
      onChange({ ...filters, [key]: value });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-end gap-3 border-b border-border/60 bg-card/90 px-4 py-3 backdrop-blur-sm">
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

      <span className="ml-auto pb-1 text-xs text-muted-foreground">
        {loading
          ? "Carregando…"
          : `${total} contrato${total !== 1 ? "s" : ""}`}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MapaPage() {
  const [allPoints, setAllPoints] = useState<MapPoint[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    uf:       "all",
    regiao:   "all",
    vagasMin: "",
    vagasMax: "",
  });

  useEffect(() => {
    fetch("/api/dashboard/contratos?resource=mapa")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<MapPoint[]>;
      })
      .then(setAllPoints)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const points = useMemo(() => {
    const { uf, regiao, vagasMin, vagasMax } = filters;
    const min = vagasMin !== "" ? Number(vagasMin) : 0;
    const max = vagasMax !== "" ? Number(vagasMax) : Infinity;
    const ufsRegiao = regiao !== "all" ? new Set(REGIOES[regiao] ?? []) : null;

    return allPoints.filter((p) => {
        if (uf !== "all" && p.uf !== uf) return false;
        if (uf === "all" && ufsRegiao && !ufsRegiao.has(p.uf)) return false;
        if (p.vagas_contratadas < min) return false;
        if (p.vagas_contratadas > max) return false;
        return true;
      });
  }, [filters, allPoints]);

  return (
    <main className="flex h-full flex-col">
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        total={points.length}
        loading={loading}
      />

      <section className="relative isolate min-h-0 flex-1">
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
              key={pointKey(point)}   // cnpj_dígitos + contrato_ano_dígitos — sem colisão
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
