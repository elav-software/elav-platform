"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@crm/api/supabaseClient";
import { getMyChurchId } from "@crm/api/apiClient";
import { Card } from "@crm/components/ui/card";
import PageHeader from "../components/shared/PageHeader";
import {
  Users, Heart, Package, Music, Music2, Mic2, HandHeart, Star,
  Video, Share2, Volume2, Zap, Monitor, Sparkles, Award, Shield,
  Home, Scissors, Activity, Smile, X, Phone, Mail, ChevronRight,
} from "lucide-react";

const AREAS_CONFIG = [
  { name: "Consolidación",           icon: Heart,     bg: "bg-rose-100",    text: "text-rose-600",    border: "border-rose-200" },
  { name: "Vasos de barro",          icon: Package,   bg: "bg-amber-100",   text: "text-amber-600",   border: "border-amber-200" },
  { name: "Coro Kids",               icon: Music,     bg: "bg-purple-100",  text: "text-purple-600",  border: "border-purple-200" },
  { name: "Alabanza",                icon: Music2,    bg: "bg-indigo-100",  text: "text-indigo-600",  border: "border-indigo-200" },
  { name: "Expresión",               icon: Mic2,      bg: "bg-violet-100",  text: "text-violet-600",  border: "border-violet-200" },
  { name: "Intercesión",             icon: HandHeart, bg: "bg-pink-100",    text: "text-pink-600",    border: "border-pink-200" },
  { name: "CFC Niños",               icon: Star,      bg: "bg-yellow-100",  text: "text-yellow-600",  border: "border-yellow-200" },
  { name: "Medios",                  icon: Video,     bg: "bg-blue-100",    text: "text-blue-600",    border: "border-blue-200" },
  { name: "Social media",            icon: Share2,    bg: "bg-sky-100",     text: "text-sky-600",     border: "border-sky-200" },
  { name: "Sonido",                  icon: Volume2,   bg: "bg-cyan-100",    text: "text-cyan-600",    border: "border-cyan-200" },
  { name: "Luces",                   icon: Zap,       bg: "bg-orange-100",  text: "text-orange-600",  border: "border-orange-200" },
  { name: "Pantalla",                icon: Monitor,   bg: "bg-slate-100",   text: "text-slate-600",   border: "border-slate-200" },
  { name: "Llamados a la escena",    icon: Sparkles,  bg: "bg-fuchsia-100", text: "text-fuchsia-600", border: "border-fuchsia-200" },
  { name: "Servicio Especial",       icon: Award,     bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-300" },
  { name: "Seguridad",               icon: Shield,    bg: "bg-green-100",   text: "text-green-600",   border: "border-green-200" },
  { name: "Casa en Orden",           icon: Home,      bg: "bg-teal-100",    text: "text-teal-600",    border: "border-teal-200" },
  { name: "Asesoramiento de Imagen", icon: Scissors,  bg: "bg-lime-100",    text: "text-lime-600",    border: "border-lime-200" },
  { name: "Primeros Auxilios",       icon: Activity,  bg: "bg-red-100",     text: "text-red-600",     border: "border-red-200" },
  { name: "Embajadores de Alegría",  icon: Smile,     bg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-200" },
];

export default function ServiceAreas() {
  const [loading, setLoading] = useState(true);
  const [personas, setPersonas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);

  useEffect(() => {
    const load = async () => {
      const churchId = await getMyChurchId();
      let q = supabase
        .from("personas")
        .select("id, nombre, apellido, foto_url, rol, telefono, email, area_servicio_actual");
      if (churchId) q = q.eq("church_id", churchId);
      q = q.not("area_servicio_actual", "is", null).neq("area_servicio_actual", "");
      const { data, error } = await q;
      if (!error) setPersonas(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const membersForArea = (areaName) =>
    personas.filter(p =>
      p.area_servicio_actual
        ?.split(",")
        .map(s => s.trim())
        .includes(areaName)
    );

  const totalVolunteers = personas.length;
  const selectedConfig = AREAS_CONFIG.find(a => a.name === selectedArea);
  const selectedMembers = selectedArea ? membersForArea(selectedArea) : [];

  if (loading) {
    return (
      <div>
        <PageHeader title="Área de Servicios" subtitle="Cargando áreas..." />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Área de Servicios"
        subtitle={`${totalVolunteers} voluntarios asignados · ${AREAS_CONFIG.length} áreas`}
      />

      <div className={`grid gap-6 ${selectedArea ? "grid-cols-1 xl:grid-cols-3" : ""}`}>

        {/* ── Area cards grid ── */}
        <div className={selectedArea ? "xl:col-span-2" : ""}>
          <div className={`grid gap-3 ${
            selectedArea
              ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          }`}>
            {AREAS_CONFIG.map((area) => {
              const members = membersForArea(area.name);
              const isSelected = selectedArea === area.name;
              const Icon = area.icon;
              return (
                <button
                  key={area.name}
                  onClick={() => setSelectedArea(isSelected ? null : area.name)}
                  className={`group relative flex flex-col items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 shadow-sm hover:shadow-md
                    ${isSelected
                      ? `${area.bg} ${area.border} shadow-md scale-[1.01]`
                      : "bg-white border-slate-100 hover:border-slate-200"
                    }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${area.bg}`}>
                    <Icon className={`w-5 h-5 ${area.text}`} />
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <p className={`text-xs font-bold leading-tight mb-1 ${isSelected ? area.text : "text-slate-700"}`}>
                      {area.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span className={`text-xs font-semibold ${members.length > 0 ? area.text : "text-slate-400"}`}>
                        {members.length}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className={`absolute top-2 right-2 w-5 h-5 rounded-full ${area.bg} ${area.text} flex items-center justify-center`}>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Member detail panel ── */}
        {selectedArea && selectedConfig && (
          <div className="xl:col-span-1">
            <Card className="border-0 shadow-sm sticky top-4">
              {/* Panel header */}
              <div className={`p-5 rounded-t-2xl ${selectedConfig.bg} border-b ${selectedConfig.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center`}>
                      <selectedConfig.icon className={`w-5 h-5 ${selectedConfig.text}`} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-sm ${selectedConfig.text}`}>{selectedArea}</h3>
                      <p className="text-xs text-slate-500">{selectedMembers.length} voluntario{selectedMembers.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedArea(null)}
                    className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Member list */}
              <div className="p-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                {selectedMembers.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Sin voluntarios asignados</p>
                    <p className="text-xs mt-1">Nadie eligió esta área aún</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedMembers.map(p => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 transition-all"
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          {p.foto_url ? (
                            <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full ${selectedConfig.bg} flex items-center justify-center`}>
                              <span className={`text-sm font-bold ${selectedConfig.text}`}>
                                {(p.nombre?.[0] ?? "") + (p.apellido?.[0] ?? "")}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {p.nombre} {p.apellido}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{p.rol ?? "Miembro"}</p>
                          {p.telefono && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" /> {p.telefono}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
