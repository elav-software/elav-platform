"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "@connect/lib/router-compat";
import { supabase } from "@connect/api/supabaseClient";
import { getCurrentChurchId } from "@connect/api/apiClient";
import { 
  ArrowLeft, 
  Send, 
  Calendar,
  Users,
  DollarSign,
  MessageSquare,
  Heart,
  CheckCircle
} from "lucide-react";

export default function PortalReportes() {
  const [leader, setLeader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recentReports, setRecentReports] = useState([]);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    attendance_count: 0,
    new_visitors: 0,
    offering_amount: '',
    testimonies: '',
    prayer_requests: '',
    observations: ''
  });

  useEffect(() => {
    verifyAndLoadLeader();
  }, []);

  const verifyAndLoadLeader = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/connect/portal/login");
        return;
      }

      const churchId = await getCurrentChurchId();
      
      const { data: leaderData, error } = await supabase
        .from('personas')
        .select('id, nombre, apellido, email')
        .eq('church_id', churchId)
        .eq('email', session.user.email)
        .eq('es_lider', true)
        .eq('estado_aprobacion', 'aprobado')
        .single();

      if (error || !leaderData) {
        navigate("/connect/portal/login");
        return;
      }

      setLeader(leaderData);
      await loadRecentReports(leaderData.id);
      
    } catch (err) {
      console.error("Error:", err);
      navigate("/connect/portal/login");
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
          offering_amount: formData.offering_amount ? parseFloat(formData.offering_amount) : null,
          status: 'submitted'
        }]);

      if (error) throw error;

      setSuccess(true);
      
      // Reset form
      setFormData({
        report_date: new Date().toISOString().split('T')[0],
        attendance_count: 0,
        new_visitors: 0,
        offering_amount: '',
        testimonies: '',
        prayer_requests: '',
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
            onClick={() => navigate("/connect/portal/dashboard")}
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

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Fecha de la reunión
              </label>
              <input
                type="date"
                required
                value={formData.report_date}
                onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Asistencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Asistencia total
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.attendance_count}
                  onChange={(e) => setFormData({ ...formData, attendance_count: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Visitantes nuevos
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.new_visitors}
                  onChange={(e) => setFormData({ ...formData, new_visitors: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Ofrenda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Ofrenda (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.offering_amount}
                onChange={(e) => setFormData({ ...formData, offering_amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Testimonios */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Testimonios
              </label>
              <textarea
                rows="3"
                value={formData.testimonies}
                onChange={(e) => setFormData({ ...formData, testimonies: e.target.value })}
                placeholder="Compartí los testimonios de la reunión..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Pedidos de oración */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Heart className="w-4 h-4 inline mr-2" />
                Pedidos de oración
              </label>
              <textarea
                rows="3"
                value={formData.prayer_requests}
                onChange={(e) => setFormData({ ...formData, prayer_requests: e.target.value })}
                placeholder="Escribí los pedidos de oración..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones generales
              </label>
              <textarea
                rows="2"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Cualquier otra información relevante..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar Reporte
                </>
              )}
            </button>
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
