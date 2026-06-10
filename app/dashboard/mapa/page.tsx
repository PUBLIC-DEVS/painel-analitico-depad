"use client";

import dynamic from "next/dynamic";

const MapaBrasil = dynamic(() => import("@/components/MapaBrasil"), {
  ssr: false,
  loading: () => <div style={{ padding: 24 }}>Carregando mapa…</div>,
});

export default function Mapa() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <main className="min-h-0 flex-1">
        <MapaBrasil />
      </main>
    </div>
  );
}
