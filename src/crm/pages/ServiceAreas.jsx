"use client";
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@crm/api/supabaseClient";
import { getMyChurchId } from "@crm/api/apiClient";
import { Card } from "@crm/components/ui/card";
import PageHeader from "../components/shared/PageHeader";
import toast from "react-hot-toast";
import {
  Users, Heart, Package, Music, Music2, Mic2, HandHeart, Star,
  Video, Share2, Volume2, Zap, Monitor, Sparkles, Award, Shield,
  Home, Scissors, Activity, Smile, X, Phone, Mail, ChevronRight,
  FileText, Upload, File, Trash2, Plus, BookOpen,
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

  // ── Materiales por área ──
  const [areaTab, setAreaTab] = useState("members"); // "members" | "materials"
  const [areaMaterials, setAreaMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [matForm, setMatForm] = useState({ title: "", description: "", category: "", url: "" });
  const [matFile, setMatFile] = useState(null);
  const [matUploading, setMatUploading] = useState(false);
  const matFileRef = useRef(null);

  const CATEGORIAS = ["Estudio bíblico", "Planilla", "Manual", "Recurso", "Otro"];

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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

  // Cargar materiales cuando cambia el área o la pestaña
  useEffect(() => {
    if (selectedArea && areaTab === "materials") loadAreaMaterials(selectedArea);
  }, [selectedArea, areaTab]);

  const loadAreaMaterials = async (areaName) => {
    setMaterialsLoading(true);
    try {
      const churchId = await getMyChurchId();
      const { data, error } = await supabase
        .from("leader_materials")
        .select("id, title, description, category, type, url, is_active, created_at")
        .eq("church_id", churchId)
        .eq("service_area", areaName)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[loadAreaMaterials] code:", error.code, "message:", error.message, "details:", error.details, "hint:", error.hint);
        toast.error(`Error: ${error.message || error.code || JSON.stringify(error)}`);
      } else {
        setAreaMaterials(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleMatFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMatFile(file);
    setMatForm(prev => ({ ...prev, title: prev.title || file.name.replace(/\.[^/.]+$/, "") }));
  };

  const handleMatSubmit = async (e) => {
    e.preventDefault();
    if (!matForm.title) { toast.error("El título es obligatorio"); return; }
    if (!matFile && !matForm.url) { toast.error("Subí un archivo o ingresá una URL"); return; }
    setMatUploading(true);
    try {
      const churchId = await getMyChurchId();
      const { data: { session } } = await supabase.auth.getSession();
      let fileUrl = matForm.url;
      let filePath = null;
      let fileSize = null;

      if (matFile) {
        const ext = matFile.name.split(".").pop();
        filePath = `${churchId}/${Date.now()}-${matForm.title.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;

        const fd = new FormData();
        fd.append("file", matFile);
        fd.append("filePath", filePath);
        const res = await fetch("/api/crm/upload-material", {
          method: "POST",
          headers: { Authorization: `Bearer ${session?.access_token}` },
          body: fd,
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Error al subir archivo");
        fileUrl = result.signedUrl;
        fileSize = matFile.size;
      }

      const { error } = await supabase.from("leader_materials").insert({
        church_id: churchId,
        title: matForm.title,
        description: matForm.description || null,
        category: matForm.category || null,
        type: matFile ? "document" : "link",
        url: fileUrl,
        file_path: filePath,
        file_size: fileSize,
        uploaded_by: session?.user?.id,
        is_active: true,
        service_area: selectedArea,
      });

      if (error) throw error;

      // Notificar en el portal a los miembros del área
      await supabase.from("portal_notifications").insert({
        church_id: churchId,
        type: "material",
        title: matForm.title,
        body: `Nuevo material disponible para el área de ${selectedArea}`,
        target: selectedArea,
        source_table: "leader_materials",
      });

      toast.success("Material subido correctamente");
      setShowMaterialForm(false);
      setMatForm({ title: "", description: "", category: "", url: "" });
      setMatFile(null);
      loadAreaMaterials(selectedArea);
    } catch (err) {
      console.error(err);
      toast.error("Error al subir el material");
    } finally {
      setMatUploading(false);
    }
  };

  const handleMatDelete = async (material) => {
    if (!confirm(`¿Eliminar "${material.title}"?`)) return;
    try {
      if (material.file_path) {
        await supabase.storage.from("materiales").remove([material.file_path]);
      }
      await supabase.from("leader_materials").delete().eq("id", material.id);
      toast.success("Material eliminado");
      loadAreaMaterials(selectedArea);
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar");
    }
  };

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
                  onClick={() => {
                    setSelectedArea(isSelected ? null : area.name);
                    setAreaTab("members");
                    setAreaMaterials([]);
                    setShowMaterialForm(false);
                  }}
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
                    onClick={() => {
                      setSelectedArea(null);
                      setAreaTab("members");
                      setAreaMaterials([]);
                      setShowMaterialForm(false);
                    }}
                    className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Pestañas: Miembros / Materiales */}
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setAreaTab("members")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                    areaTab === "members"
                      ? `${selectedConfig.text} border-b-2 ${selectedConfig.border.replace("border-", "border-b-")}`
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Miembros ({selectedMembers.length})
                </button>
                <button
                  onClick={() => setAreaTab("materials")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                    areaTab === "materials"
                      ? `${selectedConfig.text} border-b-2 ${selectedConfig.border.replace("border-", "border-b-")}`
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Materiales
                </button>
              </div>

              {/* Member list */}
              {areaTab === "members" && (
              <div className="p-3 max-h-[calc(100vh-320px)] overflow-y-auto">
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
              )}

              {/* Materials panel */}
              {areaTab === "materials" && (
                <div className="p-3 max-h-[calc(100vh-320px)] overflow-y-auto">
                  {/* Botón subir */}
                  <button
                    onClick={() => setShowMaterialForm(true)}
                    className={`w-full flex items-center justify-center gap-2 py-2 mb-3 rounded-xl border-2 border-dashed text-xs font-semibold transition-colors ${selectedConfig.border} ${selectedConfig.text} hover:opacity-80`}
                  >
                    <Plus className="w-4 h-4" /> Subir material
                  </button>

                  {materialsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-5 h-5 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                    </div>
                  ) : areaMaterials.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">Sin materiales todavía</p>
                      <p className="text-xs mt-1">Subí el primero con el botón de arriba</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {areaMaterials.map(m => (
                        <div key={m.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedConfig.bg}`}>
                            <FileText className={`w-4 h-4 ${selectedConfig.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{m.title}</p>
                            {m.category && <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">{m.category}</span>}
                            {m.file_size && <span className="text-[10px] text-slate-400 ml-1">{formatSize(m.file_size)}</span>}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <a href={m.url} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                            <button onClick={() => handleMatDelete(m)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Modal subir material */}
      {showMaterialForm && selectedConfig && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Subir material</h2>
                <p className={`text-sm font-medium mt-0.5 ${selectedConfig.text}`}>{selectedArea}</p>
              </div>
              <button onClick={() => { setShowMaterialForm(false); setMatFile(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMatSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Archivo</label>
                <div
                  onClick={() => matFileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  {matFile ? (
                    <div className="flex items-center justify-center gap-3 text-blue-600">
                      <File className="w-5 h-5" />
                      <span className="font-medium text-sm">{matFile.name}</span>
                      <span className="text-gray-400 text-xs">({formatSize(matFile.size)})</span>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <Upload className="w-7 h-7 mx-auto mb-1" />
                      <p className="text-sm">Click para seleccionar un archivo</p>
                      <p className="text-xs mt-0.5">PDF, Excel, Word, etc.</p>
                    </div>
                  )}
                </div>
                <input ref={matFileRef} type="file" className="hidden" onChange={handleMatFileSelect} />
              </div>

              {!matFile && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">O pegá un link externo</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={matForm.url}
                    onChange={e => setMatForm(p => ({ ...p, url: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Título *</label>
                <input
                  type="text"
                  value={matForm.title}
                  onChange={e => setMatForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ej: Repertorio Mayo 2026"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={matForm.description}
                  onChange={e => setMatForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Descripción breve del contenido..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                <select
                  value={matForm.category}
                  onChange={e => setMatForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Sin categoría</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowMaterialForm(false); setMatFile(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={matUploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {matUploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {matUploading ? "Subiendo..." : "Subir material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
