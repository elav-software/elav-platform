"use client";

import { useState, useEffect } from "react";
import { supabase } from "@connect/api/supabaseClient";
import { getCurrentChurchId } from "@connect/api/apiClient";
import { LogOut, UserPlus, CheckCircle, ChevronDown } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const EMPTY_FORM = {
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
  visit_date: new Date().toISOString().slice(0, 10),
  invited_by: "",
  notes: "",
};

const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all";
const labelCls = "block text-sm font-semibold text-slate-700 mb-1";

export default function ConsolidacionPortal() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [recentVisitors, setRecentVisitors] = useState([]);

  const redirect = (path) => { window.location.href = path; };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    verifyAndLoad();
  }, []);

  const verifyAndLoad = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        redirect("/connect/portal/login");
        return;
      }

      const churchId = await getCurrentChurchId();
      const userEmail = session.user.email?.toLowerCase().trim();

      // Verificar que tenga rol Consolidación
      const { data: persona, error } = await supabase
        .from('personas')
        .select('id, nombre, apellido, email')
        .eq('church_id', churchId)
        .ilike('email', userEmail)
        .eq('rol', 'Consolidación')
        .single();

      if (error || !persona) {
        console.error("Usuario de consolidación no encontrado:", userEmail, error);
        supabase.auth.signOut();
        redirect("/connect/portal/login");
        return;
      }

      setUser({ ...persona, churchId });
      await loadRecent(churchId, userEmail);
    } catch (err) {
      console.error("Error en consolidación:", err);
      supabase.auth.signOut();
      redirect("/connect/portal/login");
    } finally {
      setLoading(false);
    }
  };

  const loadRecent = async (churchId, registeredBy) => {
    try {
      const { data } = await supabase
        .from('visitors')
        .select('id, name, phone, visit_date, follow_up_status')
        .eq('church_id', churchId)
        .ilike('invited_by', `%${registeredBy}%`)
        .order('created_at', { ascending: false })
        .limit(10);
      setRecentVisitors(data || []);
    } catch (err) {
      console.error("Error cargando visitantes recientes:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('visitors').insert([{
        name: form.name.trim(),
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        visit_date: form.visit_date || null,
        invited_by: form.invited_by || `${user.nombre} ${user.apellido}`.trim(),
        notes: form.notes || null,
        follow_up_status: "Pending",
        church_id: user.churchId,
      }]);

      if (error) throw error;

      toast.success("¡Visitante registrado!");
      setForm({ ...EMPTY_FORM, visit_date: new Date().toISOString().slice(0, 10) });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      await loadRecent(user.churchId, user.email);
    } catch (err) {
      console.error("Error guardando visitante:", err);
      toast.error("Error al guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    redirect("/connect/portal/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  const FOLLOW_UP_LABELS = {
    Pending: { label: "Pendiente", cls: "bg-yellow-100 text-yellow-700" },
    Contacted: { label: "Contactado", cls: "bg-blue-100 text-blue-700" },
    "In Progress": { label: "En seguimiento", cls: "bg-purple-100 text-purple-700" },
    Converted: { label: "Miembro", cls: "bg-green-100 text-green-700" },
    Inactive: { label: "Inactivo", cls: "bg-slate-100 text-slate-500" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-slate-100">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Portal Consolidación</h1>
            <p className="text-sm text-gray-500">Hola, {user?.nombre} {user?.apellido}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Formulario de visitante */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Registrar Visitante</h2>
                <p className="text-purple-200 text-sm">Completá los datos del visitante</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className={labelCls}>Nombre completo *</label>
              <input className={inputCls} value={form.name} onChange={set("name")} placeholder="Ej: Juan Pérez" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Teléfono</label>
                <input type="tel" className={inputCls} value={form.phone} onChange={set("phone")} placeholder="Ej: 1123456789" />
              </div>
              <div>
                <label className={labelCls}>WhatsApp</label>
                <input type="tel" className={inputCls} value={form.whatsapp} onChange={set("whatsapp")} placeholder="Ej: 1123456789" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls} value={form.email} onChange={set("email")} placeholder="correo@ejemplo.com" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Fecha de visita</label>
                <input type="date" className={inputCls} value={form.visit_date} onChange={set("visit_date")} />
              </div>
              <div>
                <label className={labelCls}>¿Quién lo trajo?</label>
                <input className={inputCls} value={form.invited_by} onChange={set("invited_by")} placeholder="Nombre de quien lo invitó" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Notas adicionales</label>
              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                value={form.notes}
                onChange={set("notes")}
                placeholder="Observaciones, necesidades de oración, etc."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : submitted ? (
                <><CheckCircle className="w-4 h-4" /> ¡Registrado!</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Registrar visitante</>
              )}
            </button>
          </form>
        </div>

        {/* Visitantes recientes */}
        {recentVisitors.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Tus registros recientes</h3>
              <p className="text-xs text-gray-500 mt-0.5">Últimos 10 visitantes registrados por vos</p>
            </div>
            <ul className="divide-y divide-gray-50">
              {recentVisitors.map(v => {
                const status = FOLLOW_UP_LABELS[v.follow_up_status] || FOLLOW_UP_LABELS.Pending;
                return (
                  <li key={v.id} className="px-6 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{v.name}</p>
                      {v.phone && <p className="text-xs text-slate-500">{v.phone}</p>}
                      {v.visit_date && <p className="text-xs text-slate-400">{new Date(v.visit_date + 'T00:00:00').toLocaleDateString('es-AR')}</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${status.cls}`}>
                      {status.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

      </main>
    </div>
  );
}
