"use client";

import "leaflet/dist/leaflet.css";
import L, { LatLng } from "leaflet";
import type { LocationEvent } from "leaflet";
import { useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { useRouter } from "next/navigation";

import type { MapPoint } from "@/app/api/dashboard/contratos/_types";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function pointKey(point: MapPoint): string {
  return point.cnpj.replace(/\D/g, "") + point.contrato_ano.replace(/\D/g, "");
}

function cnpjParam(point: MapPoint): string {
  return point.cnpj.replace(/\D/g, "");
}

function LocationMarker() {
  const [position, setPosition] = useState<LatLng | null>(null);

  useMapEvents({
    click(e) {
      if ((e.originalEvent.target as HTMLElement).closest(".leaflet-popup")) {
        return;
      }
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

function ComunidadePopup({ point }: { point: MapPoint }) {
  const router = useRouter();

  function handleDetalhes() {
    router.push(`/dashboard/comunidade/${cnpjParam(point)}`);
  }

  return (
    <div className="min-w-[200px] font-sans">
      <strong className="mb-0.5 block text-sm leading-snug">
        {point.nome_fantasia || point.nome}
      </strong>
      {point.nome_fantasia && (
        <span className="mb-1 block text-xs text-gray-500">{point.nome}</span>
      )}
      <span className="mb-2 block text-xs text-gray-400">
        Contrato: {point.contrato_ano}
      </span>

      <dl className="mb-3 space-y-0.5 text-xs">
        <div className="flex gap-1">
          <dt className="shrink-0 text-gray-500">CNPJ</dt>
          <dd className="font-mono">{point.cnpj || "-"}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="shrink-0 text-gray-500">Localidade</dt>
          <dd>{point.cidade ? `${point.cidade} / ${point.uf}` : point.uf || "-"}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="shrink-0 text-gray-500">Status</dt>
          <dd>{point.status_ct || "-"}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="shrink-0 text-gray-500">Recurso/mês</dt>
          <dd>{point.recurso_mensal || "-"}</dd>
        </div>

        <div className="mt-1 border-t border-gray-100 pt-1">
          <dt className="mb-0.5 text-gray-500">Vagas contratadas</dt>
          <dd className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span>
              Total: <strong>{point.vagas_contratadas}</strong>
            </span>
            <span>
              Masc.: <strong>{point.adulto_masc}</strong>
            </span>
            <span>
              Fem.: <strong>{point.adulto_feminino}</strong>
            </span>
            <span>
              Mães: <strong>{point.maes}</strong>
            </span>
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={handleDetalhes}
        className="w-full rounded border border-gray-300 px-2 py-1 text-center text-xs transition-colors hover:bg-gray-50"
      >
        Mais detalhes
      </button>
    </div>
  );
}

export default function MapCanvas({ points }: { points: MapPoint[] }) {
  return (
    <MapContainer
      center={[-15.7801, -47.9292]}
      zoom={4}
      touchZoom
      scrollWheelZoom
      className="absolute inset-0"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LocationMarker />

      {points.map((point) => (
        <Marker
          key={pointKey(point)}
          position={[point.lat, point.lng] as [number, number]}
        >
          <Popup minWidth={220} maxWidth={280}>
            <ComunidadePopup point={point} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
