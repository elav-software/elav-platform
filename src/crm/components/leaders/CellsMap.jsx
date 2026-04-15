"use client";
import React, { useState, useEffect } from "react";
import { MapPin, Clock, Navigation, ExternalLink } from "lucide-react";

const GEO_CONTEXT = ", Argentina";

const DAY_ES = {
  Monday: "Lunes", Tuesday: "Martes", Wednesday: "Miércoles",
  Thursday: "Jueves", Friday: "Viernes", Saturday: "Sábado", Sunday: "Domingo"
};

export default function CellsMap({ leaders, selectedLeader, onSelectLeader }) {
  const [focused, setFocused] = useState(selectedLeader || null);

  useEffect(() => {
    if (selectedLeader) setFocused(selectedLeader);
  }, [selectedLeader]);

  const mappable = leaders.filter(l => (l.latitude && l.longitude) || l.meeting_location);

  const getEmbedUrl = (leader) => {
    // Coordenadas exactas = un solo pin (loc: evita búsqueda con múltiples resultados)
    if (leader.latitude && leader.longitude) {
      return `https://maps.google.com/maps?q=loc:${leader.latitude},${leader.longitude}&z=16&output=embed`;
    }
    if (leader.meeting_location) {
      const address = leader.meeting_location.includes("Argentina") ? leader.meeting_location : leader.meeting_location + GEO_CONTEXT;
      return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=16&output=embed`;
    }
    return null;
  };

  const getGoogleMapsLink = (leader) => {
    if (leader.latitude && leader.longitude) {
      return `https://www.google.com/maps?q=${leader.latitude},${leader.longitude}`;
    }
    if (leader.meeting_location) {
      const address = leader.meeting_location.includes("Argentina") ? leader.meeting_location : leader.meeting_location + GEO_CONTEXT;
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }
    return null;
  };

  const handleSelect = (leader) => {
    setFocused(leader);
    onSelectLeader(leader);
  };

  return (
    <div className="space-y-4">
      {/* Google Maps iframe */}
      <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100">
        {focused ? (
          <>
            <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>
                  Ubicación de{" "}
                  <span className="text-amber-700 font-semibold">{focused.full_name}</span>
                  {focused.cell_name ? ` — ${focused.cell_name}` : ""}
                </span>
              </div>
              <a
                href={getGoogleMapsLink(focused)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir en Google Maps
              </a>
            </div>
            <iframe
              key={focused.id}
              src={getEmbedUrl(focused)}
              width="100%"
              height="400"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Mapa - ${focused.full_name}`}
            />
          </>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center gap-3 text-slate-400">
            <MapPin className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">Selecciona una célula para ver su ubicación</p>
          </div>
        )}
      </div>

      {/* Leader cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {mappable.map(leader => {
          const isActive = focused?.id === leader.id;
          return (
            <button
              key={leader.id}
              onClick={() => handleSelect(leader)}
              className={`text-left p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${
                isActive
                  ? "bg-amber-50 border-amber-400 ring-1 ring-amber-300"
                  : "bg-white border-slate-100 hover:border-amber-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${isActive ? "bg-amber-200" : "bg-slate-100"}`}>
                  <MapPin className={`w-4 h-4 ${isActive ? "text-amber-700" : "text-slate-500"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 text-sm truncate">{leader.full_name}</p>
                  {leader.cell_name && (
                    <p className={`text-xs font-medium truncate ${isActive ? "text-amber-700" : "text-amber-600"}`}>
                      {leader.cell_name}
                    </p>
                  )}
                  {(leader.meeting_day || leader.meeting_time) && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        {DAY_ES[leader.meeting_day] || leader.meeting_day || ""}
                        {leader.meeting_time ? ` ${leader.meeting_time}` : ""}
                      </span>
                    </div>
                  )}
                  {leader.meeting_location && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                      <Navigation className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{leader.meeting_location}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}