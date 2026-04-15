"use client";
import React, { useState, useEffect, useRef } from "react";
import { MapPin, Clock, Navigation, ExternalLink, Phone, Mail } from "lucide-react";

const DAY_ES = {
  Monday: "Lunes", Tuesday: "Martes", Wednesday: "Miércoles",
  Thursday: "Jueves", Friday: "Viernes", Saturday: "Sábado", Sunday: "Domingo"
};

// Carga dinámica de Leaflet (SSR-safe)
let L = null;

function getGoogleMapsLink(leader) {
  if (leader.latitude && leader.longitude) {
    return `https://www.google.com/maps?q=${leader.latitude},${leader.longitude}`;
  }
  if (leader.meeting_location) {
    const addr = leader.meeting_location.includes("Argentina")
      ? leader.meeting_location
      : leader.meeting_location + ", Argentina";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  }
  return null;
}

export default function CellsMap({ leaders, selectedLeader, onSelectLeader }) {
  const mapRef = useRef(null);        // referencia al div contenedor
  const leafletMapRef = useRef(null); // instancia de L.Map
  const markersRef = useRef({});      // id → L.Marker
  const [focused, setFocused] = useState(selectedLeader || null);
  const [leafletReady, setLeafletReady] = useState(false);

  const mappable = leaders.filter(l => l.latitude && l.longitude);

  // ── 1. Cargar Leaflet y CSS dinámicamente ──────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    import("leaflet").then((mod) => {
      L = mod.default;
      // Fix para el ícono default de Leaflet cuando se empaqueta con webpack
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Inyectar CSS de Leaflet si no está ya
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id   = "leaflet-css";
        link.rel  = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      setLeafletReady(true);
    });
  }, []);

  // ── 2. Inicializar el mapa una sola vez ─────────────────────────────────
  useEffect(() => {
    if (!leafletReady || !mapRef.current || leafletMapRef.current) return;

    // Centro inicial: Buenos Aires
    const map = L.map(mapRef.current, { zoomControl: true }).setView([-34.6037, -58.3816], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    leafletMapRef.current = map;
  }, [leafletReady]);

  // ── 3. Sincronizar marcadores cuando cambia la lista ────────────────────
  useEffect(() => {
    if (!leafletMapRef.current || !L) return;
    const map = leafletMapRef.current;

    // Íconos
    const blueIcon = L.icon({
      iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize:    [25, 41],
      iconAnchor:  [12, 41],
      popupAnchor: [1, -34],
    });

    // Borrar marcadores eliminados
    Object.keys(markersRef.current).forEach(id => {
      if (!mappable.find(l => String(l.id) === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Agregar o actualizar
    mappable.forEach(leader => {
      const key = String(leader.id);
      const dayLabel = DAY_ES[leader.meeting_day] || leader.meeting_day || "";
      const popupHtml = `
        <div style="min-width:200px;font-family:sans-serif">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${leader.full_name}</div>
          ${leader.cell_name ? `<div style="color:#d97706;font-size:12px;font-weight:600;margin-bottom:6px">${leader.cell_name}</div>` : ""}
          ${leader.meeting_location ? `<div style="font-size:12px;color:#555;margin-bottom:2px">📍 ${leader.meeting_location}</div>` : ""}
          ${dayLabel || leader.meeting_time ? `<div style="font-size:12px;color:#555;margin-bottom:2px">🕐 ${dayLabel}${leader.meeting_time ? " " + leader.meeting_time : ""}</div>` : ""}
          ${leader.phone ? `<div style="font-size:12px;color:#555;margin-bottom:2px">📞 ${leader.phone}</div>` : ""}
          ${leader.email ? `<div style="font-size:12px;color:#555;margin-bottom:6px">✉️ ${leader.email}</div>` : ""}
          ${getGoogleMapsLink(leader) ? `<a href="${getGoogleMapsLink(leader)}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#2563eb">Abrir en Google Maps ↗</a>` : ""}
        </div>`;

      if (markersRef.current[key]) {
        markersRef.current[key].setLatLng([leader.latitude, leader.longitude]);
      } else {
        const marker = L.marker([leader.latitude, leader.longitude], { icon: blueIcon });
        marker.bindPopup(popupHtml, { maxWidth: 260 });
        marker.on("click", () => {
          setFocused(leader);
          onSelectLeader(leader);
        });
        marker.addTo(map);
        markersRef.current[key] = marker;
      }
    });

    // Ajustar vista para mostrar todos los marcadores
    if (mappable.length > 0 && !selectedLeader) {
      const bounds = L.latLngBounds(mappable.map(l => [l.latitude, l.longitude]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [mappable.length, leafletReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 4. Cuando se selecciona un líder externamente, centrar y abrir popup
  useEffect(() => {
    if (!selectedLeader) return;
    setFocused(selectedLeader);
    const key = String(selectedLeader.id);
    const marker = markersRef.current[key];
    if (marker && leafletMapRef.current) {
      leafletMapRef.current.setView([selectedLeader.latitude, selectedLeader.longitude], 15, { animate: true });
      marker.openPopup();
    }
  }, [selectedLeader]);

  const handleCardClick = (leader) => {
    setFocused(leader);
    onSelectLeader(leader);
    const key = String(leader.id);
    const marker = markersRef.current[key];
    if (marker && leafletMapRef.current) {
      leafletMapRef.current.setView([leader.latitude, leader.longitude], 15, { animate: true });
      marker.openPopup();
    }
  };

  return (
    <div className="space-y-4">
      {/* Mapa */}
      <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span>
              {focused
                ? <><span className="text-blue-700 font-semibold">{focused.full_name}</span>{focused.cell_name ? ` — ${focused.cell_name}` : ""}</>
                : <span className="text-slate-400">{mappable.length} célula{mappable.length !== 1 ? "s" : ""} con ubicación</span>
              }
            </span>
          </div>
          {focused && getGoogleMapsLink(focused) && (
            <a
              href={getGoogleMapsLink(focused)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir en Google Maps
            </a>
          )}
        </div>

        {/* Contenedor del mapa */}
        {mappable.length === 0 ? (
          <div className="h-[480px] flex flex-col items-center justify-center gap-3 text-slate-400">
            <MapPin className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">No hay líderes con coordenadas geocodificadas</p>
            <p className="text-xs">Usá el botón de pin en cada líder para geocodificar su dirección</p>
          </div>
        ) : (
          <div ref={mapRef} style={{ height: "480px", width: "100%" }} />
        )}
      </div>

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {mappable.map(leader => {
          const isActive = focused?.id === leader.id;
          const dayLabel = DAY_ES[leader.meeting_day] || leader.meeting_day || "";
          return (
            <button
              key={leader.id}
              onClick={() => handleCardClick(leader)}
              className={`text-left p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${
                isActive
                  ? "bg-blue-50 border-blue-400 ring-1 ring-blue-300"
                  : "bg-white border-slate-100 hover:border-blue-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${isActive ? "bg-blue-200" : "bg-slate-100"}`}>
                  <MapPin className={`w-4 h-4 ${isActive ? "text-blue-700" : "text-slate-500"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 text-sm truncate">{leader.full_name}</p>
                  {leader.cell_name && (
                    <p className={`text-xs font-medium truncate ${isActive ? "text-blue-700" : "text-amber-600"}`}>
                      {leader.cell_name}
                    </p>
                  )}
                  {(dayLabel || leader.meeting_time) && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{dayLabel}{leader.meeting_time ? ` ${leader.meeting_time}` : ""}</span>
                    </div>
                  )}
                  {leader.meeting_location && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                      <Navigation className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{leader.meeting_location}</span>
                    </div>
                  )}
                  {leader.phone && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{leader.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Aviso líderes sin coordenadas */}
      {(() => {
        const sinCoords = leaders.filter(l => !l.latitude || !l.longitude);
        if (sinCoords.length === 0) return null;
        return (
          <p className="text-xs text-slate-400 text-center mt-1">
            {sinCoords.length} líder{sinCoords.length !== 1 ? "es" : ""} sin coordenadas geocodificadas no aparece{sinCoords.length !== 1 ? "n" : ""} en el mapa.
          </p>
        );
      })()}
    </div>
  );
}