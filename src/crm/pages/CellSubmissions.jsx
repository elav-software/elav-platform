"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@crm/api/supabaseClient";
import { getMyChurchId } from "@crm/api/apiClient";
import { FileText, Users, DollarSign, Eye, CheckCircle, Clock, Archive } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_LABEL = { submitted: "Pendiente", reviewed: "Revisado", archived: "Archivado" };
const STATUS_COLOR = {
  submitted: "bg-amber-100 text-amber-700",
  reviewed:  "bg-green-100 text-green-700",
  archived:  "bg-slate-100 text-slate-500",
};

export default function CellSubmissions() {
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [filter, setFilter]       = useState("all");

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const churchId = await getMyChurchId();
      const { data, error } = await supabase
        .from("leader_cell_submissions")
        .select(`
          *,
          personas!leader_id(nombre, apellido, grupo_celula)
        `)
        .eq("church_id", churchId)
        .order("report_date", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  };

  const markReviewed = async (id) => {
    const { error } = await supabase
      .from("leader_cell_submissions")
      .update({ status: "reviewed", reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) { toast.error("Error al actualizar"); return; }
    toast.success("Reporte marcado como revisado");
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: "reviewed" } : r));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: "reviewed" }));
  };

  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);

  // Totales del mes actual
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthReports = reports.filter(r => r.report_date?.startsWith(thisMonth));
  const totalAttendance = monthReports.reduce((s, r) => s + (r.attendance_count || 0), 0);
  const totalVisitors   = monthReports.reduce((s, r) => s + (r.new_visitors || 0), 0);
  const totalOffering   = monthReports.reduce((s, r) => s + (parseFloat(r.offering_amount) || 0), 0);
  const pending         = reports.filter(r => r.status === "submitted").length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reportes de Células</h1>
        <p className="text-slate-500 text-sm mt-1">Reportes enviados por los líderes desde el portal</p>
      </div>

      {/* KPIs del mes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pendientes de revisión", value: pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Asistencia este mes", value: totalAttendance, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Visitantes este mes", value: totalVisitors, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Ofrenda este mes", value: `$${totalOffering.toLocaleString("es-AR")}`, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
            <Icon className={`w-8 h-8 ${color}`} />
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 lg:gap-6 flex-col lg:flex-row">
        {/* Lista */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Filtros */}
          <div className="flex gap-2 p-4 border-b border-slate-100">
            {["all", "submitted", "reviewed", "archived"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === f ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {f === "all" ? "Todos" : STATUS_LABEL[f]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Cargando reportes...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No hay reportes</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(report => {
                const leader = report.personas;
                const name = leader ? `${leader.nombre} ${leader.apellido}` : report.leader_email;
                const cell = leader?.grupo_celula || "—";
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelected(report)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selected?.id === report.id ? "bg-slate-50" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{name}</p>
                        <p className="text-xs text-slate-500">{cell} · {report.report_date}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-500">{report.attendance_count} asistentes</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[report.status]}`}>
                          {STATUS_LABEL[report.status]}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalle */}
        {selected ? (
          <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 self-start">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Detalle del Reporte</h2>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[selected.status]}`}>
                {STATUS_LABEL[selected.status]}
              </span>
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-slate-500">Líder</p>
              <p className="font-semibold text-slate-800">
                {selected.personas ? `${selected.personas.nombre} ${selected.personas.apellido}` : selected.leader_email}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Asistentes", value: selected.attendance_count },
                { label: "Visitantes", value: selected.new_visitors || 0 },
                { label: "Ofrenda", value: selected.offering_amount ? `$${parseFloat(selected.offering_amount).toLocaleString("es-AR")}` : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="font-bold text-slate-800">{value}</p>
                </div>
              ))}
            </div>

            {selected.testimonies && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Testimonios</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selected.testimonies}</p>
              </div>
            )}

            {selected.prayer_requests && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Pedidos de Oración</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selected.prayer_requests}</p>
              </div>
            )}

            {selected.observations && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Observaciones</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selected.observations}</p>
              </div>
            )}

            {selected.status === "submitted" && (
              <button
                onClick={() => markReviewed(selected.id)}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar como Revisado
              </button>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex w-96 bg-slate-50 rounded-2xl border border-dashed border-slate-200 items-center justify-center text-slate-400 self-start" style={{ minHeight: 200 }}>
            <div className="text-center">
              <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Seleccioná un reporte para ver el detalle</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
