"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
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

const MapCanvas = dynamic(() => import("@/components/dashboard-mops/map-canvas"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

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
    <main className="flex min-h-[calc(100vh-4rem)] flex-col">
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        total={points.length}
        loading={loading}
      />

      <section className="relative isolate min-h-[520px] flex-1">
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

        <MapCanvas points={points} />
      </section>
    </main>
  );
}
