"use client";

import { useState, useEffect } from "react";
import { supabase } from "@connect/api/supabaseClient";
import { getCurrentChurchId, checkIsSuperadmin } from "@connect/api/apiClient";
import {
  ArrowLeft,
  Send,
  CheckCircle,
  CheckSquare,
  Square,
  Users,
} from "lucide-react";

export default function PortalReportes() {
  const [leader, setLeader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recentReports, setRecentReports] = useState([]);
  const [success, setSuccess] = useState(false);
  const [members, setMembers] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const redirect = (path) => { window.location.href = path; };

  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    testimonies: '',
    new_visitors: '',
    prayer_requests: '',
    offering_amount: '',
    observations: ''
  });

  useEffect(() => {
    verifyAndLoadLeader();
  }, []);

  const verifyAndLoadLeader = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        redirect("/connect/portal/login");
        return;
      }

      const churchId = await getCurrentChurchId();

      const superadmin = await checkIsSuperadmin();
      if (superadmin) {
        setLeader({ id: null, nombre: 'Superadmin', apellido: '', email: session.user.email });
        setLoading(false);
        return;
      }

      const { data: leaderData, error } = await supabase
        .from('personas')
        .select('id, nombre, apellido, email')
        .eq('church_id', churchId)
        .ilike('email', session.user.email)
        .eq('rol', 'Líder')
        .eq('estado_aprobacion', 'aprobado')
        .single();

      if (error || !leaderData) {
        redirect("/connect/portal/login");
        return;
      }

      setLeader(leaderData);
      await loadRecentReports(leaderData.id);

      // Cargar miembros de la célula
      const { data: membersData } = await supabase
        .from('personas')
        .select('id, nombre, apellido, telefono')
        .eq('church_id', churchId)
        .eq('lider_id', leaderData.id)
        .order('apellido');

      if (membersData?.length > 0) {
        setMembers(membersData);
        const defaultMap = {};
        membersData.forEach(m => { defaultMap[m.id] = true; });
        setAttendanceMap(defaultMap);
      }

    } catch (err) {
      console.error("Error:", err);
      redirect("/connect/portal/login");
    } finally {
      setLoading(false);
    }
  };

  const loadRecentReports = async (leaderId) => {
    try {
      const { data, error } = await supabase
        .from('leader_cell_submissions')
        .select('*')
        .eq('leader_id', leaderId)
        .order('report_date', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentReports(data);
      }
    } catch (err) {
      console.error("Error loading reports:", err);
    }
  };

  const togglePresent = (personId) => {
    setAttendanceMap(prev => ({ ...prev, [personId]: !prev[personId] }));
  };

  const presentCount = Object.values(attendanceMap).filter(Boolean).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const churchId = await getCurrentChurchId();

      const attendanceCount = members.length > 0
        ? presentCount
        : (formData.attendance_count ? parseInt(formData.attendance_count) : 0);

      const { error } = await supabase
        .from('leader_cell_submissions')
        .insert([{
          church_id: churchId,
          leader_id: leader.id,
          leader_email: leader.email,
          report_date: formData.report_date,
          testimonies: formData.testimonies,
          attendance_count: attendanceCount,
          new_visitors: formData.new_visitors ? parseInt(formData.new_visitors) : 0,
          prayer_requests: formData.prayer_requests ? parseInt(formData.prayer_requests) : null,
          offering_amount: formData.offering_amount ? parseFloat(formData.offering_amount) : null,
          observations: formData.observations,
          status: 'submitted'
        }]);

      if (error) throw error;

      // Guardar asistencia individual si hay miembros cargados
      if (members.length > 0) {
        const personIds = members.map(m => m.id);
        await supabase
          .from('attendance')
          .delete()
          .in('person_id', personIds)
          .eq('fecha', formData.report_date);

        const records = members.map(m => ({
          person_id: m.id,
          fecha: formData.report_date,
          presente: attendanceMap[m.id] ?? true,
        }));
        await supabase.from('attendance').insert(records);
      }

      // Sincronizar con cell_reports via API
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await fetch('/api/connect/sync-cell-report', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              reportDate: formData.report_date,
              topic: formData.testimonies,
              attendance: attendanceCount,
              visits: formData.new_visitors,
              newConverts: formData.prayer_requests,
              offering: formData.offering_amount,
              notes: formData.observations,
            }),
          });
        }
      } catch (syncErr) {
        console.warn('No se pudo sincronizar con CRM:', syncErr);
      }

      setSuccess(true);

      setFormData({
        report_date: new Date().toISOString().split('T')[0],
        testimonies: '',
        new_visitors: '',
        prayer_requests: '',
        offering_amount: '',
        observations: ''
      });
      if (members.length > 0) {
        const defaultMap = {};
        members.forEach(m => { defaultMap[m.id] = true; });
        setAttendanceMap(defaultMap);
      }

      await loadRecentReports(leader.id);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Error al enviar el reporte. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => redirect("/connect/portal/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Célula</h1>
            <p className="text-sm text-gray-600">Cargá la información de tu última reunión</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">¡Reporte enviado exitosamente! El pastor lo recibirá en el CRM.</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-8">
          <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2 text-lg">
            <Send className="w-4 h-4 text-amber-500" /> Enviar Reporte de Célula
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Datos generales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fecha *</label>
                <input
                  type="date"
                  required
                  value={formData.report_date}
                  onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                  className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tema / Mensaje</label>
                <input
                  type="text"
                  value={formData.testimonies}
                  onChange={(e) => setFormData({ ...formData, testimonies: e.target.value })}
                  className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Visitas realizadas</label>
                <input
                  type="number"
                  min="0"
                  value={formData.new_visitors}
                  onChange={(e) => setFormData({ ...formData, new_visitors: e.target.value })}
                  className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nuevos convertidos</label>
                <input
                  type="number"
                  min="0"
                  value={formData.prayer_requests}
                  onChange={(e) => setFormData({ ...formData, prayer_requests: e.target.value })}
                  className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Ofrenda ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.offering_amount}
                  onChange={(e) => setFormData({ ...formData, offering_amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notas adicionales</label>
                <input
                  type="text"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            {/* Asistencia de miembros */}
            {members.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Users className="w-4 h-4 text-amber-500" />
                    ¿Quiénes asistieron?
                  </label>
                  <span className="text-sm font-bold text-amber-600">
                    {presentCount}/{members.length} presentes
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {members.map(member => {
                    const presente = attendanceMap[member.id] ?? true;
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => togglePresent(member.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          presente
                            ? 'bg-green-50 border-green-400'
                            : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                          presente ? 'bg-green-500' : 'bg-gray-400'
                        }`}>
                          {member.nombre?.[0]}{member.apellido?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.nombre} {member.apellido}
                          </p>
                          {member.telefono && (
                            <p className="text-xs text-gray-400 truncate">{member.telefono}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {presente
                            ? <CheckSquare className="w-5 h-5 text-green-600" />
                            : <Square className="w-5 h-5 text-gray-400" />
                          }
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Asistencia (cantidad total)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.attendance_count}
                  onChange={(e) => setFormData({ ...formData, attendance_count: e.target.value })}
                  className="w-40 h-9 px-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-400 mt-1">Cuando tengas miembros cargados en tu célula, podrás tildar quién asistió.</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Enviar Reporte
              </button>
            </div>
          </form>
        </div>

        {/* Reportes recientes */}
        {recentReports.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reportes recientes</h2>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(report.report_date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {report.attendance_count} asistente{report.attendance_count !== 1 ? 's' : ''}
                      {report.new_visitors > 0 && ` · ${report.new_visitors} visita${report.new_visitors !== 1 ? 's' : ''}`}
                      {report.testimonies && ` · ${report.testimonies}`}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    report.status === 'reviewed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {report.status === 'reviewed' ? 'Revisado' : 'Enviado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
