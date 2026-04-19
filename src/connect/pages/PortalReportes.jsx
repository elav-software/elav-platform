"use client";

import { useState, useEffect } from "react";
import { supabase } from "@connect/api/supabaseClient";
import { getCurrentChurchId, checkIsSuperadmin } from "@connect/api/apiClient";
import { 
  ArrowLeft, 
  Send, 
  CheckCircle
} from "lucide-react";

export default function PortalReportes() {
  const [leader, setLeader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recentReports, setRecentReports] = useState([]);
  const [success, setSuccess] = useState(false);
  const redirect = (path) => { window.location.href = path; };

  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    testimonies: '',       // Tema / Mensaje
    attendance_count: '',  // Asistencia
    new_visitors: '',      // Visitas realizadas
    prayer_requests: '',   // Nuevos convertidos
    offering_amount: '',   // Ofrenda ($)
    observations: ''       // Notas adicionales
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
      
      // Superadmin bypass
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const churchId = await getCurrentChurchId();
      
      const { error } = await supabase
        .from('leader_cell_submissions')
        .insert([{
          church_id: churchId,
          leader_id: leader.id,
          leader_email: leader.email,
          ...formData,
          attendance_count: formData.attendance_count ? parseInt(formData.attendance_count) : 0,
          new_visitors: formData.new_visitors ? parseInt(formData.new_visitors) : 0,
          offering_amount: formData.offering_amount ? parseFloat(formData.offering_amount) : null,
          status: 'submitted'
        }]);

      if (error) throw error;

      // Sincronizar con cell_reports via API con service role (bypassea RLS)
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
              attendance: formData.attendance_count,
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
      
      // Reset form
      setFormData({
        report_date: new Date().toISOString().split('T')[0],
        testimonies: '',
        attendance_count: '',
        new_visitors: '',
        prayer_requests: '',
        offering_amount: '',
        observations: ''
      });

      // Reload reports
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
      {/* Header */}
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
            <p className="text-sm text-gray-600">
              Cargá la información de tu última reunión
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">
              ¡Reporte enviado exitosamente! El pastor lo recibirá en el CRM.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-8">
          <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2 text-lg">
            <Send className="w-4 h-4 text-amber-500" /> Enviar Reporte de Célula
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Fecha */}
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
              {/* Tema / Mensaje */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tema / Mensaje</label>
                <input
                  type="text"
                  value={formData.testimonies}
                  onChange={(e) => setFormData({ ...formData, testimonies: e.target.value })}
                  className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                />
              </div>
              {/* Asistencia */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Asistencia</label>
                <input
                  type="number"
                  min="0"
                  value={formData.attendance_count}
                  onChange={(e) => setFormData({ ...formData, attendance_count: e.target.value })}
                  className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                />
              </div>
              {/* Visitas realizadas */}
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
              {/* Nuevos convertidos */}
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
              {/* Ofrenda */}
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
            </div>

            {/* Notas adicionales */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notas adicionales</label>
              <textarea
                rows="2"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-gray-900"
              />
            </div>

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

        {/* Recent Reports */}
        {recentReports.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Reportes recientes
            </h2>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div 
                  key={report.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(report.report_date).toLocaleDateString('es-AR')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {report.attendance_count} asistentes
                      {report.new_visitors > 0 && ` • ${report.new_visitors} nuevos`}
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
