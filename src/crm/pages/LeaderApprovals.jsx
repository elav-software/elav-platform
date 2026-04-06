"use client";

import { useState, useEffect } from "react";
import { supabase } from "@crm/api/supabaseClient";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  Phone, 
  Calendar,
  User,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

export default function LeaderApprovals() {
  const [loading, setLoading] = useState(true);
  const [pendingLeaders, setPendingLeaders] = useState([]);
  const [approvedLeaders, setApprovedLeaders] = useState([]);
  const [rejectedLeaders, setRejectedLeaders] = useState([]);
  const [filter, setFilter] = useState("pendiente");
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/crm/login");
        return;
      }

      const { data: churchUser } = await supabase
        .from('church_users')
        .select('role, is_active, user_id')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (!churchUser || churchUser.role !== 'admin') {
        toast.error("No tenés permisos de administrador");
        navigate("/crm/dashboard");
        return;
      }

      setCurrentUser(session.user);
      loadLeaders();
    } catch (err) {
      console.error("Error:", err);
      navigate("/crm/login");
    }
  };

  const loadLeaders = async () => {
    setLoading(true);
    try {
      // Líderes pendientes
      const { data: pending } = await supabase
        .from('personas')
        .select('*')
        .eq('rol', 'Líder')
        .eq('estado_aprobacion', 'pendiente')
        .order('created_at', { ascending: false });

      // Líderes aprobados
      const { data: approved } = await supabase
        .from('personas')
        .select('*')
        .eq('rol', 'Líder')
        .eq('estado_aprobacion', 'aprobado')
        .order('fecha_aprobacion', { ascending: false })
        .limit(10);

      // Líderes rechazados
      const { data: rejected } = await supabase
        .from('personas')
        .select('*')
        .eq('rol', 'Líder')
        .eq('estado_aprobacion', 'rechazado')
        .order('fecha_aprobacion', { ascending: false })
        .limit(10);

      setPendingLeaders(pending || []);
      setApprovedLeaders(approved || []);
      setRejectedLeaders(rejected || []);
    } catch (err) {
      console.error("Error cargando líderes:", err);
      toast.error("Error al cargar líderes");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaderId, leaderName) => {
    try {
      const { error } = await supabase
        .from('personas')
        .update({
          estado_aprobacion: 'aprobado',
          fecha_aprobacion: new Date().toISOString(),
          aprobado_por: currentUser.id
        })
        .eq('id', leaderId);

      if (error) throw error;

      toast.success(`✅ ${leaderName} aprobado como líder`);
      loadLeaders();
    } catch (err) {
      console.error("Error aprobando líder:", err);
      toast.error("Error al aprobar líder");
    }
  };

  const handleReject = async (leaderId, leaderName) => {
    if (!confirm(`¿Estás seguro de rechazar a ${leaderName}?`)) return;

    try {
      const { error } = await supabase
        .from('personas')
        .update({
          estado_aprobacion: 'rechazado',
          fecha_aprobacion: new Date().toISOString(),
          aprobado_por: currentUser.id
        })
        .eq('id', leaderId);

      if (error) throw error;

      toast.success(`Líder rechazado: ${leaderName}`);
      loadLeaders();
    } catch (err) {
      console.error("Error rechazando líder:", err);
      toast.error("Error al rechazar líder");
    }
  };

  const displayLeaders = 
    filter === 'pendiente' ? pendingLeaders :
    filter === 'aprobado' ? approvedLeaders :
    rejectedLeaders;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Aprobación de Líderes
          </h1>
          {pendingLeaders.length > 0 && (
            <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {pendingLeaders.length} pendiente{pendingLeaders.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-gray-600">
          Revisa y aprueba líderes para que puedan acceder al Portal de Líderes
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('pendiente')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
            filter === 'pendiente'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pendientes ({pendingLeaders.length})
        </button>
        <button
          onClick={() => setFilter('aprobado')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
            filter === 'aprobado'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Aprobados ({approvedLeaders.length})
        </button>
        <button
          onClick={() => setFilter('rechazado')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
            filter === 'rechazado'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
          }`}
        >
          <XCircle className="w-4 h-4" />
          Rechazados ({rejectedLeaders.length})
        </button>
      </div>

      {/* Leaders List */}
      {displayLeaders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay líderes {filter}s
          </h3>
          <p className="text-gray-600">
            {filter === 'pendiente' && "Cuando un líder llene el formulario de censo, aparecerá aquí para aprobación."}
            {filter === 'aprobado' && "Los líderes aprobados aparecerán en esta lista."}
            {filter === 'rechazado' && "Los líderes rechazados aparecerán en esta lista."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayLeaders.map((leader) => (
            <div 
              key={leader.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Leader Info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {leader.nombre?.[0]}{leader.apellido?.[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {leader.nombre} {leader.apellido}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        {leader.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {leader.email}
                          </span>
                        )}
                        {leader.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {leader.telefono}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {leader.edad && (
                      <div>
                        <span className="text-gray-500">Edad:</span>
                        <p className="font-medium text-gray-900">{leader.edad} años</p>
                      </div>
                    )}
                    {leader.grupo_celula && (
                      <div>
                        <span className="text-gray-500">Célula:</span>
                        <p className="font-medium text-gray-900">{leader.grupo_celula}</p>
                      </div>
                    )}
                    {leader.ministerio && (
                      <div>
                        <span className="text-gray-500">Ministerio:</span>
                        <p className="font-medium text-gray-900">{leader.ministerio}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Registrado:</span>
                      <p className="font-medium text-gray-900 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(leader.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {filter === 'pendiente' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(leader.id, `${leader.nombre} ${leader.apellido}`)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(leader.id, `${leader.nombre} ${leader.apellido}`)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                )}

                {filter !== 'pendiente' && leader.fecha_aprobacion && (
                  <div className="ml-4 text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      filter === 'aprobado' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {filter === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(leader.fecha_aprobacion).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
