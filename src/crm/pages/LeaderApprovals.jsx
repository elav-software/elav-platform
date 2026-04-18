"use client";

import { useState, useEffect } from "react";
import { supabase } from "@crm/api/supabaseClient";
import { getMyChurchId } from "@crm/api/apiClient";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  Phone, 
  Calendar,
  User,
  AlertCircle,
  Send,
  Users
} from "lucide-react";
import toast from "react-hot-toast";

export default function LeaderApprovals() {
  const [loading, setLoading] = useState(true);
  const [pendingLeaders, setPendingLeaders] = useState([]);
  const [approvedLeaders, setApprovedLeaders] = useState([]);
  const [rejectedLeaders, setRejectedLeaders] = useState([]);
  const [filter, setFilter] = useState("pendiente");
  const [currentUser, setCurrentUser] = useState(null);
  const [invitingId, setInvitingId] = useState(null);
  const [invitingAll, setInvitingAll] = useState(false);
  const [invitedIds, setInvitedIds] = useState(new Set());
  const [lightboxUrl, setLightboxUrl] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = "/crm/login";
        return;
      }

      // Superadmin: acceso directo desde JWT (no requiere DB)
      if (session.user.user_metadata?.role === 'superadmin') {
        setCurrentUser(session.user);
        loadLeaders();
        return;
      }

      const { data: churchUser } = await supabase
        .from('church_users')
        .select('role, is_active, user_id')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!churchUser || (churchUser.role !== 'admin' && churchUser.role !== 'superadmin')) {
        toast.error("No tenés permisos de administrador");
        window.location.href = "/crm/dashboard";
        return;
      }

      setCurrentUser(session.user);
      loadLeaders();
    } catch (err) {
      console.error("Error:", err);
      window.location.href = "/crm/login";
    }
  };

  const loadLeaders = async () => {
    setLoading(true);
    try {
      const churchId = await getMyChurchId();

      // Líderes pendientes
      const { data: pending } = await supabase
        .from('personas')
        .select('*')
        .eq('church_id', churchId)
        .eq('rol', 'Líder')
        .eq('estado_aprobacion', 'pendiente')
        .order('created_at', { ascending: false });

      // Líderes aprobados
      const { data: approved } = await supabase
        .from('personas')
        .select('*')
        .eq('church_id', churchId)
        .eq('rol', 'Líder')
        .eq('estado_aprobacion', 'aprobado')
        .order('fecha_aprobacion', { ascending: false })
        .limit(10);

      // Líderes rechazados
      const { data: rejected } = await supabase
        .from('personas')
        .select('*')
        .eq('church_id', churchId)
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
      const churchId = await getMyChurchId();

      // 1. Obtener datos completos de la persona
      const { data: persona, error: fetchError } = await supabase
        .from('personas')
        .select('*')
        .eq('id', leaderId)
        .single();

      if (fetchError) throw fetchError;

      // Obtener ciudad de la iglesia por separado
      const { data: church } = await supabase
        .from('churches')
        .select('city, country')
        .eq('id', persona.church_id)
        .single();

      // 2. Aprobar en personas
      const { error } = await supabase
        .from('personas')
        .update({
          estado_aprobacion: 'aprobado',
          fecha_aprobacion: new Date().toISOString(),
          aprobado_por: currentUser.id
        })
        .eq('id', leaderId)
        .eq('church_id', churchId);

      if (error) throw error;

      // 3. Crear o actualizar registro en tabla leaders (si no existe ya)
      const { data: existingLeader } = await supabase
        .from('leaders')
        .select('id')
        .eq('member_id', leaderId)
        .single();

      if (!existingLeader) {
        // Geocodificar con dirección completa: lugar_reunion + barrio + ciudad de la iglesia
        let latitude = null;
        let longitude = null;
        const addressParts = [
          persona.lugar_reunion,
          persona.lugar_reunion_localidad || persona.barrio_zona,
          church?.city,
          church?.country || 'Argentina',
        ].filter(Boolean);

        if (addressParts.length > 0) {
          try {
            const address = addressParts.join(', ');
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
              { headers: { 'Accept-Language': 'es', 'User-Agent': 'CFC-CRM/1.0' } }
            );
            const geoData = await geoRes.json();
            if (geoData.length > 0) {
              latitude = parseFloat(geoData[0].lat);
              longitude = parseFloat(geoData[0].lon);
            }
          } catch (_) {
            // Si falla geocodificación, continúa sin coordenadas
          }
        }

        await supabase.from('leaders').insert({
          church_id: churchId,
          full_name: `${persona.nombre} ${persona.apellido}`.trim(),
          phone: persona.telefono || null,
          email: persona.email || null,
          cell_name: persona.grupo_celula || null,
          meeting_day: persona.dia_reunion || null,
          meeting_time: persona.hora_reunion || null,
          meeting_location: [persona.lugar_reunion, persona.lugar_reunion_localidad].filter(Boolean).join(', ') || null,
          latitude,
          longitude,
          member_id: leaderId,
          photo: persona.foto_url || null,
        });
      }

      toast.success(`✅ ${leaderName} aprobado como líder`);
      loadLeaders();
    } catch (err) {
      console.error("Error aprobando líder:", err);
      toast.error("Error al aprobar líder");
    }
  };

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const handleInvite = async (personaId, email, fullName) => {
    if (!email) {
      toast.error("Este líder no tiene email registrado");
      return;
    }
    setInvitingId(personaId);
    try {
      const token = await getToken();
      const res = await fetch("/api/crm/invite-leader", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          fullName,
          redirectBase: window.location.origin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInvitedIds(prev => new Set([...prev, personaId]));
      if (data.resent) {
        toast.success(`✉️ Email de acceso reenviado a ${email}`);
      } else {
        toast.success(`✉️ Invitación enviada a ${email}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al enviar invitación");
    } finally {
      setInvitingId(null);
    }
  };

  const handleInviteAll = async () => {
    const eligible = approvedLeaders.filter(l => l.email);
    if (eligible.length === 0) {
      toast.error("Ningún líder aprobado tiene email registrado");
      return;
    }
    if (!confirm(`¿Enviar invitación al portal a ${eligible.length} líder(es) aprobado(s)?`)) return;
    setInvitingAll(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/crm/invite-all-leaders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ redirectBase: window.location.origin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newIds = new Set(eligible.map(l => l.id));
      setInvitedIds(prev => new Set([...prev, ...newIds]));
      toast.success(`✉️ Invitaciones enviadas: ${data.invited} nuevas, ${data.skipped} ya registrados`);
    } catch (err) {
      console.error(err);
      toast.error("Error al enviar invitaciones");
    } finally {
      setInvitingAll(false);
    }
  };

  const handleReject = async (leaderId, leaderName) => {
    if (!confirm(`¿Estás seguro de rechazar a ${leaderName}?`)) return;

    try {
      const churchId = await getMyChurchId();
      const { error } = await supabase
        .from('personas')
        .update({
          estado_aprobacion: 'rechazado',
          fecha_aprobacion: new Date().toISOString(),
          aprobado_por: currentUser.id
        })
        .eq('id', leaderId)
        .eq('church_id', churchId);

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
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Foto líder"
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center text-xl font-bold transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            ×
          </button>
        </div>
      )}
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Aprobación de Líderes
          </h1>
          <div className="flex items-center gap-3">
            {pendingLeaders.length > 0 && (
              <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {pendingLeaders.length} pendiente{pendingLeaders.length !== 1 ? 's' : ''}
              </span>
            )}
            {filter === 'aprobado' && approvedLeaders.length > 0 && (
              <button
                onClick={handleInviteAll}
                disabled={invitingAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-sm disabled:opacity-50"
              >
                {invitingAll ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                Invitar a todos al Portal
              </button>
            )}
          </div>
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
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200">
                      {leader.foto_url ? (
                        <img 
                          src={leader.foto_url} 
                          alt={`${leader.nombre} ${leader.apellido}`}
                          className="w-full h-full object-cover cursor-zoom-in"
                          onClick={() => setLightboxUrl(leader.foto_url)}
                          title="Ver foto"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                          {leader.nombre?.[0]}{leader.apellido?.[0]}
                        </div>
                      )}
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

                {filter !== 'pendiente' && (
                  <div className="ml-4 text-right flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      filter === 'aprobado' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {filter === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                    </span>
                    {leader.fecha_aprobacion && (
                      <p className="text-xs text-gray-500">
                        {new Date(leader.fecha_aprobacion).toLocaleDateString('es-AR')}
                      </p>
                    )}
                    {filter === 'aprobado' && (
                      invitedIds.has(leader.id) ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3" />
                            Invitación enviada
                          </span>
                          <button
                            onClick={() => handleInvite(
                              leader.id,
                              leader.email,
                              `${leader.nombre} ${leader.apellido}`
                            )}
                            disabled={invitingId === leader.id}
                            className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                          >
                            Reenviar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInvite(
                            leader.id,
                            leader.email,
                            `${leader.nombre} ${leader.apellido}`
                          )}
                          disabled={invitingId === leader.id}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
                        >
                          {invitingId === leader.id ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          Invitar al Portal
                        </button>
                      )
                    )}
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
