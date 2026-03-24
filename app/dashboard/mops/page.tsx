"use client";
import "leaflet/dist/leaflet.css";
import Title from "@/components/Title";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { useState } from "react";
import { LatLng, LatLngExpression } from "leaflet";

// Simulando o que o seu endpoint vai retornar após limpar os dados do Graph
const comunidades = [
  { id: 1, nome: "ASSOCIAÇÃO JOÃO VITOR RODRIGUES LIMA - ABEJOVI", lat: 37.7798721, lng: -122.2821855 },
  { id: 2, nome: "ASSOCIAÇÃO CASA DA SERENIDADE", lat: -18.5909756, lng: -46.5158758 },
  { id: 3, nome: "CASA DE REINTEGRAÇÃO SOCIAL - NOVA VIDA", lat: -12.1477483, lng: -44.9953475 },
];

export default function Page() {
  function LocationMarker() {
    const [position, setPosition] = useState<LatLngExpression | null>(null);
    const map = useMapEvents({
      click() {
        map.locate();
      },
      locationfound(e) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
      },
    });

    return position === null ? null : (
      <Marker position={position}>
        <Popup>Você está aqui</Popup>
      </Marker>
    );
  }

  return (
    <main className="flex flex-col h-full">
      <Title
        title="Mapa das comunidades"
        subtitle="Visualização das geolocalizações"
      />
      <section className="flex-1 min-h-0 isolate">
        <MapContainer
          center={[-15.7801, -47.9292]} // Centralizado em Brasília
          zoom={4} // Diminuí o zoom inicial para mostrar o Brasil todo
          touchZoom={true}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <LocationMarker />

          {/* Aqui nós iteramos o array e criamos um ponteiro para cada comunidade */}
          {comunidades.map((comunidade) => (
            <Marker key={comunidade.id} position={[comunidade.lat, comunidade.lng]}>
              <Popup>
                <div className="font-sans">
                  <strong className="block text-sm mb-1">{comunidade.nome}</strong>
                  <span className="text-xs text-gray-500">Clique para mais detalhes...</span>
                  {/* Você pode colocar um botão ou um Link aqui no futuro */}
                </div>
              </Popup>
            </Marker>
          ))}
          
        </MapContainer>
      </section>
    </main>
  );
}