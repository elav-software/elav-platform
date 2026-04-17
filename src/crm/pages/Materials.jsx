"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@crm/api/supabaseClient";
import { getMyChurchId } from "@crm/api/apiClient";
import {
  Upload,
  FileText,
  Trash2,
  Plus,
  X,
  File,
} from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIAS = ["Estudio bíblico", "Planilla", "Manual", "Recurso", "Otro"];

export default function Materials() {
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "", type: "link", url: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = "/crm/login"; return; }
    loadMaterials();
  };

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const churchId = await getMyChurchId();
      const { data, error } = await supabase
        .from("leader_materials")
        .select("*")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false });
      if (!error) setMaterials(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    // Detectar tipo por extensión
    const ext = file.name.split(".").pop()?.toLowerCase();
    const type = ext === "pdf" ? "pdf" : ["xls", "xlsx", "csv"].includes(ext) ? "document" : "document";
    setForm(prev => ({ ...prev, type, title: prev.title || file.name.replace(/\.[^/.]+$/, "") }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) { toast.error("El título es obligatorio"); return; }
    if (!selectedFile && !form.url) { toast.error("Subí un archivo o ingresá una URL"); return; }

    setUploading(true);
    try {
      const churchId = await getMyChurchId();
      const { data: { session } } = await supabase.auth.getSession();
      let fileUrl = form.url;
      let filePath = null;
      let fileSize = null;

      if (selectedFile) {
        const ext = selectedFile.name.split(".").pop();
        filePath = `${churchId}/${Date.now()}-${form.title.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("materiales")
          .upload(filePath, selectedFile, { upsert: false });
        if (uploadError) throw uploadError;

        // URL firmada válida por 1 año (se renueva al descargar desde el portal)
        const { data: signedData } = await supabase.storage
          .from("materiales")
          .createSignedUrl(filePath, 60 * 60 * 24 * 365);
        fileUrl = signedData?.signedUrl ?? "";
        fileSize = selectedFile.size;
      }

      const { error } = await supabase.from("leader_materials").insert({
        church_id: churchId,
        title: form.title,
        description: form.description || null,
        category: form.category || null,
        type: selectedFile ? (form.type || "document") : "link",
        url: fileUrl,
        file_path: filePath,
        file_size: fileSize,
        uploaded_by: session?.user?.id,
        is_active: true,
      });

      if (error) throw error;
      toast.success("Material subido correctamente");
      setShowForm(false);
      setForm({ title: "", description: "", category: "", type: "link", url: "" });
      setSelectedFile(null);
      loadMaterials();
    } catch (err) {
      console.error(err);
      toast.error("Error al subir el material");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (material) => {
    if (!confirm(`¿Eliminar "${material.title}"?`)) return;
    try {
      if (material.file_path) {
        await supabase.storage.from("materiales").remove([material.file_path]);
      }
      await supabase.from("leader_materials").delete().eq("id", material.id);
      toast.success("Material eliminado");
      loadMaterials();
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar");
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Materiales para Líderes</h1>
          <p className="text-gray-600 mt-1">Subí recursos que los líderes verán en su portal</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow"
        >
          <Plus className="w-5 h-5" />
          Nuevo material
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Subir material</h2>
              <button onClick={() => { setShowForm(false); setSelectedFile(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Archivo o URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Archivo</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3 text-blue-600">
                      <File className="w-6 h-6" />
                      <span className="font-medium">{selectedFile.name}</span>
                      <span className="text-gray-400 text-sm">({formatSize(selectedFile.size)})</span>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Click para seleccionar un archivo</p>
                      <p className="text-xs mt-1">PDF, Excel, Word, etc.</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
              </div>

              {/* O URL externa */}
              {!selectedFile && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">O pegá un link externo</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={form.url}
                    onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ej: Estudio Efesios Cap. 1"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Descripción breve del contenido..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Sin categoría</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setSelectedFile(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? "Subiendo..." : "Subir material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <FileText className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay materiales todavía</h3>
          <p className="text-gray-500">Hacé click en "Nuevo material" para subir el primero</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {materials.map(m => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{m.title}</h3>
                  {m.category && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{m.category}</span>
                  )}
                  {!m.is_active && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">Oculto</span>
                  )}
                </div>
                {m.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{m.description}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(m.created_at).toLocaleDateString("es-AR")}
                  {m.file_size ? ` · ${formatSize(m.file_size)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                >
                  Ver
                </a>
                <button
                  onClick={() => handleDelete(m)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
