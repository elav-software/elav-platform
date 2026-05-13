"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@crm/api/supabaseClient";
import { getMyChurchId } from "@crm/api/apiClient";
import { FileText, Users, DollarSign, Eye, CheckCircle, Clock, Archive, Trash2, UserCheck, UserX } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_LABEL = { submitted: "Pendiente", reviewed: "Revisado", archived: "Archivado" };
const STATUS_COLOR = {
  submitted: "bg-amber-100 text-amber-700",
  reviewed:  "bg-green-100 text-green-700",
  archived:  "bg-slate-100 text-slate-500",
};

export default function CellSubmissions() {
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [filter, setFilter]         = useState("all");
  const [attendanceDetail, setAttendanceDetail] = useState(null); // { members: [{name, presente}] }

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const churchId = await getMyChurchId();

      // 1. Reportes enviados desde el portal
      const { data: submissions, error: e1 } = await supabase
        .from("leader_cell_submissions")
        .select(`*, personas!leader_id(nombre, apellido, grupo_celula)`)
        .eq("church_id", churchId)
        .order("report_date", { ascending: false });
      if (e1) throw e1;

      // 2. Reportes cargados directamente en CRM (cell_reports)
      const { data: crmReports } = await supabase
        .from("cell_reports")
        .select(`*, leaders!leader_id(full_name, district, member_id)`)
        .eq("church_id", churchId)
        .order("date", { ascending: false });

      // Deduplicar: si ya existe en portal con mismo líder (personas.id) + fecha, no agregar
      const submissionKeys = new Set(
        (submissions || []).map(s => `${s.leader_id}_${s.report_date}`)
      );

      const crmNormalized = (crmReports || [])
        .filter(r => {
          const personasId = r.leaders?.member_id;
          if (!personasId) return true; // sin vínculo a personas → mostrar igual
          return !submissionKeys.has(`${personasId}_${r.date}`);
        })
        .map(r => ({
          id: r.id,
          _fromCrm: true,
          leader_email: null,
          leader_id: r.leaders?.member_id || null,
          report_date: r.date,
          attendance_count: r.attendance || 0,
          new_visitors: r.visits || 0,
          offering_amount: r.offering || 0,
          testimonies: r.topic,
          prayer_requests: null,
          observations: r.notes,
          status: "reviewed",
          created_at: r.created_at,
          personas: r.leaders
            ? {
                nombre: r.leaders.full_name?.split(" ")[0] || r.leaders.full_name || "",
                apellido: r.leaders.full_name?.split(" ").slice(1).join(" ") || "",
                grupo_celula: r.leaders.district,
              }
            : null,
        }));

      const allReports = [...(submissions || []), ...crmNormalized].sort(
        (a, b) => (b.report_date || "").localeCompare(a.report_date || "")
      );

      setReports(allReports);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (report) => {
    if (!confirm("¿Eliminar este reporte? Esta acción no se puede deshacer.")) return;
    const table = report._fromCrm ? "cell_reports" : "leader_cell_submissions";
    const { error } = await supabase.from(table).delete().eq("id", report.id);
    if (error) { toast.error("Error al eliminar: " + error.message); return; }
    toast.success("Reporte eliminado");
    setReports(prev => prev.filter(r => r.id !== report.id));
    setSelected(null);
    setAttendanceDetail(null);
  };

  const loadAttendanceDetail = async (report) => {
    setAttendanceDetail(null);
    if (!report.leader_id || !report.report_date) return;
    try {
      // Personas de la célula
      const { data: members } = await supabase
        .from('personas')
        .select('id, nombre, apellido')
        .eq('lider_id', report.leader_id)
        .in('rol', ['Miembro', 'Líder']);
      if (!members?.length) return;

      const ids = members.map(m => m.id);
      const { data: att } = await supabase
        .from('attendance')
        .select('person_id, presente')
        .in('person_id', ids)
        .eq('fecha', report.report_date);

      const attMap = {};
      (att || []).forEach(a => { attMap[a.person_id] = a.presente; });

      // Solo mostrar si hay al menos un registro de asistencia guardado
      const hasData = (att || []).length > 0;
      if (!hasData) return;

      setAttendanceDetail(members.map(m => ({
        id: m.id,
        name: `${m.nombre} ${m.apellido}`.trim(),
        presente: attMap[m.id] ?? null, // null = sin dato
      })));
    } catch (err) {
      console.warn('Error cargando asistencia:', err);
    }
  };

  const markAllReviewed = async () => {
    const toReview = reports.filter(r => r.status === "submitted" && !r._fromCrm);
    if (toReview.length === 0) {
      toast("No hay reportes nuevos pendientes de revisión");
      return;
    }
    const ids = toReview.map(r => r.id);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("leader_cell_submissions")
      .update({ status: "reviewed", reviewed_at: now })
      .in("id", ids);
    if (error) { toast.error("Error: " + error.message); return; }
    toast.success(`${ids.length} reporte(s) marcados como revisados`);
    setReports(prev => prev.map(r => ids.includes(r.id) ? { ...r, status: "reviewed" } : r));
  };

  const markReviewed = async (id) => {
    const { error } = await supabase
      .from("leader_cell_submissions")
      .update({ status: "reviewed", reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) { toast.error("Error al actualizar: " + error.message); return; }
    toast.success("Reporte marcado como revisado");
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: "reviewed" } : r));
    setSelected(prev => prev?.id === id ? { ...prev, status: "reviewed" } : prev);
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
          <div className="flex gap-2 p-4 border-b border-slate-100 items-center">
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
            {pending > 0 && (
              <div className="flex-1 flex justify-end">
                <button
                  onClick={markAllReviewed}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Revisar Todo ({pending})
                </button>
              </div>
            )}
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
                    onClick={() => { setSelected(report); loadAttendanceDetail(report); }}
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

            {/* Asistencia individual */}
            {attendanceDetail && attendanceDetail.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Asistencia individual</p>
                <div className="space-y-1.5">
                  {attendanceDetail.map(m => (
                    <div key={m.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${
                      m.presente ? 'bg-green-50' : 'bg-rose-50'
                    }`}>
                      {m.presente
                        ? <UserCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                        : <UserX className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      }
                      <span className={`text-sm font-medium ${m.presente ? 'text-green-800' : 'text-rose-600'}`}>
                        {m.name}
                      </span>
                      <span className="ml-auto text-xs font-semibold">
                        {m.presente ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            <button
              onClick={() => deleteReport(selected)}
              className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold py-2.5 rounded-xl transition-colors border border-rose-200"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Reporte
            </button>
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
