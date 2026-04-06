"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "@connect/lib/router-compat";
import { supabase } from "@connect/api/supabaseClient";
import { getCurrentChurchId } from "@connect/api/apiClient";
import { 
  ArrowLeft, 
  Heart,
  Plus,
  Check,
  AlertCircle,
  MessageCircle,
  CheckCircle
} from "lucide-react";

export default function PortalOracion() {
  const [loading, setLoading] = useState(true);
  const [leader, setLeader] = useState(null);
  const [prayers, setPrayers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('active');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    prayer_for: '',
    request_text: '',
    category: '',
    is_urgent: false,
    is_confidential: false
  });

  useEffect(() => {
    verifyAndLoadPrayers();
  }, []);

  const verifyAndLoadPrayers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/connect/portal/login");
        return;
      }

      const churchId = await getCurrentChurchId();
      
      const { data: leaderData, error: leaderError } = await supabase
        .from('personas')
        .select('id, nombre, apellido, email')
        .eq('church_id', churchId)
        .eq('email', session.user.email)
        .eq('rol', 'Líder')
        .eq('estado_aprobacion', 'aprobado')
        .single();

      if (leaderError || !leaderData) {
        navigate("/connect/portal/login");
        return;
      }

      setLeader(leaderData);
      await loadPrayers(leaderData.email);
      
    } catch (err) {
      console.error("Error:", err);
      navigate("/connect/portal/login");
    } finally {
      setLoading(false);
    }
  };

  const loadPrayers = async (email) => {
    try {
      const { data, error } = await supabase
        .from('leader_prayer_requests')
        .select('*')
        .eq('leader_email', email)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPrayers(data);
      }
    } catch (err) {
      console.error("Error loading prayers:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const churchId = await getCurrentChurchId();
      
      const { error } = await supabase
        .from('leader_prayer_requests')
        .insert([{
          church_id: churchId,
          submitted_by_leader: leader.id,
          leader_email: leader.email,
          ...formData,
          status: 'active'
        }]);

      if (error) throw error;

      // Reset form
      setFormData({
        prayer_for: '',
        request_text: '',
        category: '',
        is_urgent: false,
        is_confidential: false
      });

      setShowForm(false);
      await loadPrayers(leader.email);
      
    } catch (err) {
      console.error("Error:", err);
      alert("Error al crear el pedido. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const markAsAnswered = async (prayerId) => {
    try {
      const { error } = await supabase
        .from('leader_prayer_requests')
        .update({ status: 'answered' })
        .eq('id', prayerId);

      if (!error) {
        await loadPrayers(leader.email);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const filteredPrayers = prayers.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Pedidos de Oración</h1>
            <p className="text-sm text-gray-600">
              Cargá y gestioná pedidos de oración
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Nuevo pedido de oración
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Por quién oramos?
                </label>
                <input
                  type="text"
                  required
                  value={formData.prayer_for}
                  onChange={(e) => setFormData({ ...formData, prayer_for: e.target.value })}
                  placeholder="Nombre de la persona"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pedido
                </label>
                <textarea
                  required
                  rows="4"
                  value={formData.request_text}
                  onChange={(e) => setFormData({ ...formData, request_text: e.target.value })}
                  placeholder="Describí el pedido de oración..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  <option value="salud">Salud</option>
                  <option value="familia">Familia</option>
                  <option value="trabajo">Trabajo</option>
                  <option value="ministerio">Ministerio</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_urgent}
                    onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Urgente</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_confidential}
                    onChange={(e) => setFormData({ ...formData, is_confidential: e.target.checked })}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Confidencial</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Guardar pedido'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'active'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setFilter('answered')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'answered'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            Respondidos
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            Todos
          </button>
        </div>

        {/* Prayers List */}
        {filteredPrayers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay pedidos de oración
            </h3>
            <p className="text-gray-600">
              Hacé clic en el botón "Nuevo" para agregar un pedido.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrayers.map((prayer) => (
              <div 
                key={prayer.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {prayer.prayer_for}
                      </h3>
                      {prayer.is_urgent && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                          Urgente
                        </span>
                      )}
                      {prayer.is_confidential && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                          Confidencial
                        </span>
                      )}
                    </div>
                    {prayer.category && (
                      <span className="text-xs text-gray-500 capitalize">
                        {prayer.category}
                      </span>
                    )}
                  </div>
                  {prayer.status === 'active' && (
                    <button
                      onClick={() => markAsAnswered(prayer.id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Marcar como respondido"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                  {prayer.request_text}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {new Date(prayer.created_at).toLocaleDateString('es-AR')}
                  </span>
                  {prayer.status === 'answered' && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Respondido
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
