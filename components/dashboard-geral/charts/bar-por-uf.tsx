"use client";

import { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { fetchDashboard } from "@/lib/dashboard-cache";

// GeoJSON of Brazil states
const geoUrl =
  "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

interface UFEntry {
  uf: string;
  total: number;
}

const ufCentroids: Record<string, [number, number]> = {
  AC: [-70.55, -9.02], AL: [-36.38, -9.53], AM: [-64.62, -4.22], AP: [-51.95, 1.41],
  BA: [-41.7, -12.5], CE: [-39.32, -5.49], DF: [-47.86, -15.83], ES: [-40.3, -19.18],
  GO: [-49.8, -16.0], MA: [-45.27, -4.96], MG: [-44.28, -18.51], MS: [-54.62, -20.51],
  MT: [-55.0, -13.0], PA: [-52.93, -3.97], PB: [-36.17, -7.11], PE: [-37.65, -8.81],
  PI: [-42.72, -7.71], PR: [-51.99, -25.25], RJ: [-43.15, -22.9], RN: [-36.65, -5.79],
  RO: [-62.8, -10.9], RR: [-60.75, 2.73], RS: [-53.0, -29.5], SC: [-50.2, -27.24],
  SE: [-37.38, -10.59], SP: [-48.64, -22.19], TO: [-48.36, -10.17]
};

function MapPorUFSkeleton() {
  return (
    <Card className="min-w-0 overflow-hidden h-full flex flex-col">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-2 flex-1 justify-center items-center">
        <Skeleton className="h-[300px] w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

export default function BarPorUF({ 
  data: propData, 
  title = "Comunidades por UF",
  onUfClick,
  activeUf
}: { 
  data?: UFEntry[], 
  title?: string,
  onUfClick?: (uf: string) => void,
  activeUf?: string
}) {
  const [fetchedData, setFetchedData] = useState<UFEntry[] | null>(null);
  const [tooltipContent, setTooltipContent] = useState("");

  useEffect(() => {
    if (!propData) {
      fetchDashboard<UFEntry[]>("uf").then(setFetchedData).catch(console.error);
    }
  }, [propData]);

  const data = propData ?? fetchedData;

  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map((d) => d.total));
  }, [data]);

  const colorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain([0, maxValue])
      .range(["#dbeafe", "#1e3a8a"]); // Light Blue to DEPAD Deep Blue
  }, [maxValue]);

  if (!data) return <MapPorUFSkeleton />;

  if (data.length === 0) {
    return (
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Número de CTs registradas por estado</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[420px] items-center justify-center">
          <p className="text-sm text-muted-foreground">Nenhum dado disponível.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden flex flex-col h-full relative">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {activeUf && activeUf !== "all" && (
            <Badge 
              variant="default" 
              className="bg-primary text-primary-foreground animate-in fade-in zoom-in duration-300 flex items-center gap-1.5 cursor-pointer hover:bg-primary/90"
              onClick={() => onUfClick?.("all")}
            >
              Filtro: {activeUf}
              <X size={12} className="opacity-70 hover:opacity-100" />
            </Badge>
          )}
        </div>
        <CardDescription>Número de CTs registradas por estado</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center pt-2 relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 850,
            center: [-54, -15],
          }}
          style={{ width: "100%", height: "420px" }}
          onClick={() => onUfClick?.("all")}
        >
          {/* Transparent background to catch clicks outside states */}
          <rect width={800} height={600} fill="transparent" />
          
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const ufSigla = geo.properties.sigla;
                const ufData = data.find((s) => s.uf === ufSigla);
                const valor = ufData ? ufData.total : 0;
                
                const isActive = activeUf === ufSigla;
                const isFaded = activeUf && activeUf !== "all" && !isActive;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={valor > 0 ? colorScale(valor) : "#f1f5f9"}
                    stroke={isActive ? "#dc2626" : "#ffffff"}
                    strokeWidth={isActive ? 2.5 : 0.5}
                    style={{
                      default: { 
                        outline: "none", 
                        transition: "all 250ms",
                        opacity: isFaded ? 0.2 : 1
                      },
                      hover: {
                        fill: "#2563eb",
                        outline: "none",
                        cursor: "pointer",
                        opacity: isFaded ? 0.6 : 0.9,
                      },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={() => {
                      setTooltipContent(`${geo.properties.name}: ${valor} comunidade${valor !== 1 ? 's' : ''}`);
                    }}
                    onMouseLeave={() => {
                      setTooltipContent("");
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onUfClick) {
                        onUfClick(ufSigla);
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* Markers for numbers */}
          {data.filter(d => d.total > 0).map((d) => {
            const centroid = ufCentroids[d.uf];
            if (!centroid) return null;
            
            const isFaded = activeUf && activeUf !== "all" && activeUf !== d.uf;
            
            return (
              <Marker key={`marker-${d.uf}`} coordinates={centroid}>
                <text
                  textAnchor="middle"
                  y={4}
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "11px",
                    fontWeight: 700,
                    fill: "#ffffff",
                    pointerEvents: "none",
                    textShadow: "0px 1px 3px rgba(0,0,0,0.9)", // Stronger shadow for readability
                    opacity: isFaded ? 0.3 : 1,
                    transition: "opacity 250ms"
                  }}
                >
                  {d.total}
                </text>
              </Marker>
            );
          })}
          {/* Improved DF Callout - Moved much further out to the right */}
          <Marker coordinates={[-47.86, -15.83]}>
            {/* The line starts at 0,0 (DF) and goes far to the right (160px) */}
            <line
              x1="0" y1="0"
              x2="160" y2="0"
              stroke={activeUf === "DF" ? "#dc2626" : "#1e3a8a"}
              strokeWidth={activeUf === "DF" ? "2" : "1"}
              strokeDasharray={activeUf === "DF" ? "0" : "3 2"}
            />
            {/* Clickable circle exactly on DF */}
            <circle
              r={activeUf === "DF" ? 6 : 4}
              fill={activeUf === "DF" ? "#dc2626" : "#1e3a8a"}
              stroke="#fff"
              strokeWidth={1.5}
              className="cursor-pointer transition-all hover:scale-125"
              onClick={(e) => {
                e.stopPropagation();
                onUfClick?.("DF");
              }}
            />
            {/* Label far out at the end of the line */}
            <text
              x="165"
              y="0"
              textAnchor="start"
              dominantBaseline="middle"
              className="cursor-pointer select-none"
              style={{
                fontSize: "13px",
                fontWeight: 800,
                fill: activeUf === "DF" ? "#dc2626" : "#1e3a8a",
                textShadow: "0px 0px 3px rgba(255,255,255,1)"
              }}
              onClick={(e) => {
                e.stopPropagation();
                onUfClick?.("DF");
              }}
            >
              DF (Distrito Federal)
            </text>
          </Marker>
        </ComposableMap>
        
        {/* Tooltip Overlay */}
        {tooltipContent && (
          <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-md border border-border/50 shadow-xl px-4 py-2.5 rounded-lg text-sm font-semibold z-10 pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-200">
            {tooltipContent}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
