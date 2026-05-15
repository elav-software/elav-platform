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
  Users,
  Pencil
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
  const [resettingId, setResettingId] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [editingLeader, setEditingLeader] = useState(null); // { id, nombre, apellido, email, telefono }
  const [editSaving, setEditSaving] = useState(false);
  const [fixingCase, setFixingCase] = useState(false);
  const [sinCargarMembers, setSinCargarMembers] = useState([]);
  const [altaLiderMember, setAltaLiderMember] = useState(null);
  const [altaLiderForm, setAltaLiderForm] = useState({ nombre: '', apellido: '', email: '', telefono: '' });
  const [savingAlta, setSavingAlta] = useState(false);

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

      // Superadmin: acceso directo desde JWT (sin DB)
      if (session.user.user_metadata?.role === 'superadmin') {
        setCurrentUser(session.user);
        loadLeaders();
        return;
      }

      const { data: churchUsers } = await supabase
        .from('church_users')
        .select('role, is_active, user_id')
        .eq('user_id', session.user.id)
        .eq('is_active', true);

      const churchUser = (churchUsers || []).find(u => u.role === 'admin' || u.role === 'superadmin');

      if (!churchUser) {
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

      const [
        { data: pending },
        { data: approved },
        { data: rejected },
        { data: sinCargar },
      ] = await Promise.all([
        supabase.from('personas').select('*')
          .eq('church_id', churchId).eq('rol', 'Líder').eq('estado_aprobacion', 'pendiente')
          .order('created_at', { ascending: false }),
        supabase.from('personas').select('*')
          .eq('church_id', churchId).eq('rol', 'Líder').eq('estado_aprobacion', 'aprobado')
          .order('fecha_aprobacion', { ascending: false }).limit(500),
        supabase.from('personas').select('*')
          .eq('church_id', churchId).eq('rol', 'Líder').eq('estado_aprobacion', 'rechazado')
          .order('fecha_aprobacion', { ascending: false }).limit(10),
        supabase.from('personas').select('*')
          .eq('church_id', churchId).eq('rol', 'Miembro').like('grupo_celula', 'LIDER_NC:%')
          .order('created_at', { ascending: false }),
      ]);

      setPendingLeaders(pending || []);
      setApprovedLeaders(approved || []);
      setRejectedLeaders(rejected || []);
      setSinCargarMembers(sinCargar || []);
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
          meeting_location: persona.lugar_reunion || null,
          district: persona.lugar_reunion_localidad || null,
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

  const markAsInvited = async (personaId) => {
    const now = new Date().toISOString();
    await supabase.from('personas').update({ portal_invitado_at: now }).eq('id', personaId);
    setApprovedLeaders(prev => prev.map(l => l.id === personaId ? { ...l, portal_invitado_at: now } : l));
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
      await markAsInvited(personaId);
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
      // Marcar como invitados en BD (todos los elegibles — invited + skipped ya estaban registrados)
      const now = new Date().toISOString();
      const failedSet = new Set(data.failedEmails || []);
      const toMark = eligible.filter(l => !failedSet.has(l.email));
      if (toMark.length > 0) {
        await supabase.from('personas').update({ portal_invitado_at: now }).in('id', toMark.map(l => l.id));
        setApprovedLeaders(prev => prev.map(l =>
          toMark.find(m => m.id === l.id) ? { ...l, portal_invitado_at: now } : l
        ));
      }
      const parts = [];
      if (data.invited > 0) parts.push(`${data.invited} enviadas`);
      if (data.skipped > 0) parts.push(`${data.skipped} ya registrados`);
      toast.success(`✉️ ${parts.join(', ')}`);
      if (data.failed > 0) {
        toast.error(`⚠️ ${data.failed} no se pudieron enviar (rate limit de Supabase). Reintentá en unos minutos.`, { duration: 8000 });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al enviar invitaciones");
    } finally {
      setInvitingAll(false);
    }
  };

  const handleResetPassword = async (personaId, email) => {
    if (!email) { toast.error("Este líder no tiene email registrado"); return; }
    if (!confirm(`¿Enviar email de reseteo de contraseña a ${email}?`)) return;
    setResettingId(personaId);
    try {
      const token = await getToken();
      const res = await fetch("/api/crm/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ email, redirectBase: window.location.origin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`🔑 Email de reseteo enviado a ${email}`);
    } catch (err) {
      console.error(err);
      toast.error("Error al enviar reseteo de contraseña");
    } finally {
      setResettingId(null);
    }
  };

  const handleEditSave = async () => {
    if (!editingLeader) return;
    setEditSaving(true);
    try {
      const { error } = await supabase
        .from('personas')
        .update({
          nombre: editingLeader.nombre.trim(),
          apellido: editingLeader.apellido.trim(),
          email: editingLeader.email.trim() || null,
          telefono: editingLeader.telefono.trim() || null,
        })
        .eq('id', editingLeader.id);
      if (error) throw error;
      toast.success('Datos actualizados');
      setEditingLeader(null);
      loadLeaders();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleFixAllNames = async () => {
    if (!confirm('¿Aplicar Title Case a todos los líderes? (Ej: "MARIA GOMEZ" → "Maria Gomez"). Esta acción modifica la base de datos.')) return;
    setFixingCase(true);
    try {
      const churchId = await getMyChurchId();
      const cap = s => s ? s.trim().toLowerCase().replace(/(^|\s)([^\s])/g, (_, sp, ch) => sp + ch.toUpperCase()) : s;

      const { data: all, error: fetchError } = await supabase
        .from('personas')
        .select('id, nombre, apellido')
        .eq('church_id', churchId)
        .eq('rol', 'Líder');
      if (fetchError) throw fetchError;

      const toFix = (all || []).filter(l =>
        (l.nombre && cap(l.nombre) !== l.nombre) ||
        (l.apellido && cap(l.apellido) !== l.apellido)
      );

      if (toFix.length === 0) {
        toast.success('Todos los nombres ya tienen el formato correcto');
        return;
      }

      let updated = 0;
      for (const l of toFix) {
        const { error } = await supabase
          .from('personas')
          .update({ nombre: cap(l.nombre), apellido: cap(l.apellido) })
          .eq('id', l.id)
          .eq('church_id', churchId);
        if (!error) updated++;
      }
      toast.success(`${updated} de ${toFix.length} nombre(s) corregido(s)`);
      loadLeaders();
    } catch (err) {
      console.error(err);
      toast.error('Error: ' + err.message);
    } finally {
      setFixingCase(false);
    }
  };

  const handleDarDeAlta = async () => {
    if (!altaLiderMember) return;
    setSavingAlta(true);
    try {
      const churchId = await getMyChurchId();
      const cap = s => s ? s.trim().toLowerCase().replace(/(^|\s)([^\s])/g, (_, sp, ch) => sp + ch.toUpperCase()) : s;

      const { data: newLeader, error: insertError } = await supabase
        .from('personas')
        .insert({
          church_id: churchId,
          nombre: cap(altaLiderForm.nombre),
          apellido: cap(altaLiderForm.apellido),
          email: altaLiderForm.email.trim() || null,
          telefono: altaLiderForm.telefono.trim() || null,
          rol: 'Líder',
          estado_aprobacion: 'pendiente',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await supabase
        .from('personas')
        .update({ lider_id: newLeader.id, grupo_celula: null })
        .eq('id', altaLiderMember.id)
        .eq('church_id', churchId);

      toast.success(`✅ Líder ${cap(altaLiderForm.nombre)} ${cap(altaLiderForm.apellido)} dado de alta — pendiente de aprobación`);
      setAltaLiderMember(null);
      loadLeaders();
    } catch (err) {
      console.error(err);
      toast.error('Error: ' + err.message);
    } finally {
      setSavingAlta(false);
    }
  };

  const openAltaModal = (member) => {
    const raw = (member.grupo_celula || '').replace('LIDER_NC:', '');
    const [nombre = '', apellido = '', telefono = ''] = raw.split('|');
    setAltaLiderForm({ nombre, apellido, email: '', telefono });
    setAltaLiderMember(member);
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
      {/* Modal de edición */}
      {editingLeader && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Editar datos del líder</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                  <input value={editingLeader.nombre} onChange={e => setEditingLeader(p => ({...p, nombre: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Apellido</label>
                  <input value={editingLeader.apellido} onChange={e => setEditingLeader(p => ({...p, apellido: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => {
                    const cap = s => s ? s.trim().toLowerCase().replace(/(^|\s)([^\s])/g, (_, sp, ch) => sp + ch.toUpperCase()) : s;
                    setEditingLeader(p => ({ ...p, nombre: cap(p.nombre), apellido: cap(p.apellido) }));
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  title="Convertir a mayúsculas/minúsculas correctas (Title Case)"
                >
                  Aa Corregir mayúsculas
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email (se usará para la invitación al portal)</label>
                <input type="email" value={editingLeader.email} onChange={e => setEditingLeader(p => ({...p, email: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                <input value={editingLeader.telefono} onChange={e => setEditingLeader(p => ({...p, telefono: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditingLeader(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleEditSave} disabled={editSaving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                {editSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dar de alta líder no cargado */}
      {altaLiderMember && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Dar de alta como líder</h2>
            <p className="text-sm text-gray-500 mb-4">
              Mencionado por <span className="font-medium text-gray-800">{altaLiderMember.nombre} {altaLiderMember.apellido}</span>
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                  <input value={altaLiderForm.nombre} onChange={e => setAltaLiderForm(p => ({...p, nombre: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Apellido *</label>
                  <input value={altaLiderForm.apellido} onChange={e => setAltaLiderForm(p => ({...p, apellido: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={altaLiderForm.email} onChange={e => setAltaLiderForm(p => ({...p, email: e.target.value}))}
                  placeholder="Para invitarlo al portal después"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                <input value={altaLiderForm.telefono} onChange={e => setAltaLiderForm(p => ({...p, telefono: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                El líder quedará en estado <strong>pendiente</strong> y aparecerá en la pestaña de Aprobaciones para que lo revises y apruebes.
              </p>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setAltaLiderMember(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleDarDeAlta} disabled={savingAlta || !altaLiderForm.nombre.trim() || !altaLiderForm.apellido.trim()}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-60">
                {savingAlta ? 'Guardando...' : 'Dar de alta'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <button
              onClick={handleFixAllNames}
              disabled={fixingCase}
              className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
              title="Aplica Title Case a nombre y apellido de todos los líderes"
            >
              {fixingCase ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="font-bold">Aa</span>
              )}
              Corregir mayúsculas
            </button>
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
        <button
          onClick={() => setFilter('sin_cargar')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
            filter === 'sin_cargar'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Líder no cargado ({sinCargarMembers.length})
        </button>
      </div>

      {/* Tab: Líder no cargado */}
      {filter === 'sin_cargar' && (
        sinCargarMembers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin novedades</h3>
            <p className="text-gray-600">Ningún miembro indicó que su líder no estaba en la lista.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sinCargarMembers.map(member => {
              const raw = (member.grupo_celula || '').replace('LIDER_NC:', '');
              const [lNombre = '', lApellido = '', lTelefono = ''] = raw.split('|');
              return (
                <div key={member.id} className="bg-white rounded-xl border border-amber-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-amber-200 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg">
                          {member.nombre?.[0]}{member.apellido?.[0]}
                        </div>
                        {member.foto_url && (
                          <img src={member.foto_url} alt="" className="absolute inset-0 w-full h-full object-cover"
                            onError={e => { e.currentTarget.style.display = 'none'; }} />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{member.nombre} {member.apellido}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                          {member.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{member.telefono}</span>}
                          {member.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{member.email}</span>}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full">
                            <User className="w-3 h-3 text-amber-600" />
                            <span className="text-xs font-medium text-amber-800">
                              Líder: {lNombre} {lApellido}
                            </span>
                          </div>
                          {lTelefono && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full">
                              <Phone className="w-3 h-3 text-amber-600" />
                              <span className="text-xs font-medium text-amber-800">{lTelefono}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => openAltaModal(member)}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold flex-shrink-0"
                    >
                      Dar de alta como líder
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Leaders List */}
      {filter !== 'sin_cargar' && (
        displayLeaders.length === 0 ? (
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
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                        {leader.nombre?.[0]}{leader.apellido?.[0]}
                      </div>
                      {leader.foto_url && (
                        <img
                          src={leader.foto_url}
                          alt={`${leader.nombre} ${leader.apellido}`}
                          className="absolute inset-0 w-full h-full object-cover cursor-zoom-in"
                          onClick={() => setLightboxUrl(leader.foto_url)}
                          title="Ver foto"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
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
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => setEditingLeader({ id: leader.id, nombre: leader.nombre || '', apellido: leader.apellido || '', email: leader.email || '', telefono: leader.telefono || '' })}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium text-sm"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </button>
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
                      <div className="flex flex-col items-end gap-1">
                        {leader.portal_invitado_at ? (
                          <>
                            <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1.5">
                              <CheckCircle className="w-3 h-3" />
                              Invitación enviada
                            </span>
                            <p className="text-[10px] text-gray-400">
                              {new Date(leader.portal_invitado_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <button
                              onClick={() => handleInvite(leader.id, leader.email, `${leader.nombre} ${leader.apellido}`)}
                              disabled={invitingId === leader.id}
                              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                            >
                              Reenviar invitación
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleInvite(leader.id, leader.email, `${leader.nombre} ${leader.apellido}`)}
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
                        )}
                        {leader.email && (
                          <button
                            onClick={() => handleResetPassword(leader.id, leader.email)}
                            disabled={resettingId === leader.id}
                            className="text-xs text-gray-500 hover:text-gray-700 hover:underline disabled:opacity-50"
                          >
                            {resettingId === leader.id ? "Enviando..." : "Resetear contraseña"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )
      )}
    </div>
  );
}
