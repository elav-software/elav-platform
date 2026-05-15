"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@connect/api/supabaseClient";
import { getCurrentChurchId, checkIsSuperadmin } from "@connect/api/apiClient";
import { 
  FileText, 
  BookOpen, 
  Users, 
  Heart, 
  LogOut,
  BarChart3,
  ChevronRight,
  Bell,
  UserPlus,
  CheckCircle,
  ArrowLeft,
  ShieldCheck,
  HandHeart,
  Calendar,
  Music,
  Music2,
  Package,
  Mic2,
  Star,
  Video,
  Share2,
  Volume2,
  Zap,
  Monitor,
  Sparkles,
  Award,
  Shield,
  Home,
  Scissors,
  Activity,
  Smile,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO CENTRAL DE SECCIONES POR ÁREA
// Para agregar una nueva área con portal: agregar una entrada acá.
// "key" debe coincidir EXACTAMENTE con el tag en area_servicio_actual.
// Las áreas sin "view" especial muestran automáticamente los materiales del área.
// ─────────────────────────────────────────────────────────────────────────────
const AREA_PORTAL_SECTIONS = {
  'Consolidación': {
    key: 'consolidacion',
    title: 'Registrar Visitante',
    description: 'Anotar datos de nuevos visitantes',
    icon: UserPlus,
    color: 'from-orange-500 to-orange-600',
    view: 'consolidacion',
  },
  'Intercesión': {
    key: 'intercesion',
    title: 'Pedidos de Oración',
    description: 'Ver y orar por los pedidos recibidos',
    icon: HandHeart,
    color: 'from-pink-500 to-pink-600',
    view: 'intercesion',
  },
  'Vasos de barro':          { key: 'vasos-de-barro',   title: 'Vasos de Barro',          description: 'Materiales y recursos del área', icon: Package,  color: 'from-amber-500 to-amber-600' },
  'Coro Kids':               { key: 'coro-kids',        title: 'Coro Kids',               description: 'Materiales y recursos del área', icon: Music,    color: 'from-purple-500 to-purple-600' },
  'Alabanza':                { key: 'alabanza',         title: 'Alabanza',                description: 'Materiales y recursos del área', icon: Music2,   color: 'from-indigo-500 to-indigo-600' },
  'Expresión':               { key: 'expresion',        title: 'Expresión',               description: 'Materiales y recursos del área', icon: Mic2,     color: 'from-violet-500 to-violet-600' },
  'CFC Niños':               { key: 'cfc-ninos',        title: 'CFC Niños',               description: 'Materiales y recursos del área', icon: Star,     color: 'from-yellow-500 to-yellow-600' },
  'Medios':                  { key: 'medios',           title: 'Medios',                  description: 'Materiales y recursos del área', icon: Video,    color: 'from-blue-500 to-blue-600' },
  'Social media':            { key: 'social-media',     title: 'Social Media',            description: 'Materiales y recursos del área', icon: Share2,   color: 'from-sky-500 to-sky-600' },
  'Sonido':                  { key: 'sonido',           title: 'Sonido',                  description: 'Materiales y recursos del área', icon: Volume2,  color: 'from-cyan-500 to-cyan-600' },
  'Luces':                   { key: 'luces',            title: 'Luces',                   description: 'Materiales y recursos del área', icon: Zap,      color: 'from-orange-400 to-orange-500' },
  'Pantalla':                { key: 'pantalla',         title: 'Pantalla',                description: 'Materiales y recursos del área', icon: Monitor,  color: 'from-slate-500 to-slate-600' },
  'Llamados a la escena':    { key: 'llamados',         title: 'Llamados a la Escena',    description: 'Materiales y recursos del área', icon: Sparkles, color: 'from-fuchsia-500 to-fuchsia-600' },
  'Servicio Especial':       { key: 'servicio-especial',title: 'Servicio Especial',       description: 'Materiales y recursos del área', icon: Award,    color: 'from-amber-600 to-amber-700' },
  'Seguridad':               { key: 'seguridad',        title: 'Seguridad',               description: 'Materiales y recursos del área', icon: Shield,   color: 'from-green-500 to-green-600' },
  'Casa en Orden':           { key: 'casa-en-orden',    title: 'Casa en Orden',           description: 'Materiales y recursos del área', icon: Home,     color: 'from-teal-500 to-teal-600' },
  'Asesoramiento de Imagen': { key: 'imagen',           title: 'Asesoramiento de Imagen', description: 'Materiales y recursos del área', icon: Scissors, color: 'from-lime-500 to-lime-600' },
  'Primeros Auxilios':       { key: 'primeros-auxilios',title: 'Primeros Auxilios',       description: 'Materiales y recursos del área', icon: Activity, color: 'from-red-500 to-red-600' },
  'Embajadores de Alegría':  { key: 'embajadores',      title: 'Embajadores de Alegría',  description: 'Materiales y recursos del área', icon: Smile,    color: 'from-emerald-500 to-emerald-600' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Formulario de Consolidación (componente inline)
// ─────────────────────────────────────────────────────────────────────────────
function ConsolidacionView({ leader, churchId, onBack }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    visit_date: new Date().toISOString().slice(0, 10),
    edad: '', estado_civil: '', barrio: '',
    invited_by: '', notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recent, setRecent] = useState([]);
  const [nuevasPersonas, setNuevasPersonas] = useState([]);
  const [contactando, setContactando] = useState(new Set());

  const setF = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  useEffect(() => { loadRecent(); loadNuevas(); }, []);

  const loadNuevas = async () => {
    const { data } = await supabase
      .from('visitors')
      .select('id, name, phone, follow_up_status, created_at')
      .eq('church_id', churchId)
      .eq('invited_by', 'web:soy-nuevo')
      .eq('follow_up_status', 'Pending')
      .order('created_at', { ascending: false })
      .limit(20);
    setNuevasPersonas(data || []);
  };

  const markAsContacted = async (visitor) => {
    if (contactando.has(visitor.id)) return;
    setContactando(prev => new Set(prev).add(visitor.id));
    try {
      const contactadoPor = `${leader.nombre} ${leader.apellido}`.trim();
      const { error } = await supabase
        .from('visitors')
        .update({ follow_up_status: 'Contacted', contacted_by: contactadoPor })
        .eq('id', visitor.id);
      if (error) throw error;
      setTimeout(() => {
        setNuevasPersonas(prev => prev.filter(v => v.id !== visitor.id));
        setContactando(prev => { const s = new Set(prev); s.delete(visitor.id); return s; });
      }, 1200);
    } catch (err) {
      console.error('Error marcando contacto:', err);
      setContactando(prev => { const s = new Set(prev); s.delete(visitor.id); return s; });
    }
  };

  const loadRecent = async () => {
    const { data } = await supabase
      .from('visitors')
      .select('id, name, phone, visit_date')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false })
      .limit(8);
    setRecent(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('visitors').insert([{
        name: form.name.trim(),
        phone: form.phone || null,
        whatsapp: null,
        email: form.email || null,
        visit_date: form.visit_date || null,
        edad: form.edad ? parseInt(form.edad, 10) : null,
        estado_civil: form.estado_civil || null,
        barrio: form.barrio || null,
        invited_by: form.invited_by || `${leader.nombre} ${leader.apellido}`.trim(),
        notes: form.notes || null,
        follow_up_status: 'Pending',
        church_id: churchId,
      }]);
      if (error) throw error;
      setForm({ name: '', phone: '', email: '', visit_date: new Date().toISOString().slice(0, 10), edad: '', estado_civil: '', barrio: '', invited_by: '', notes: '' });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      await loadRecent();
    } catch (err) {
      console.error('Error guardando visitante:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al portal
        </button>
      )}
      <h2 className="text-xl font-bold text-gray-900 mb-6">Registrar Visitante</h2>

      {/* Personas Nuevas desde la web */}
      {nuevasPersonas.length > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-2xl overflow-hidden">
          <div className="bg-orange-500 px-5 py-4 flex items-center gap-3">
            <Bell className="w-5 h-5 text-white" />
            <div>
              <p className="text-white font-bold text-sm">Personas Nuevas desde la web</p>
              <p className="text-orange-100 text-xs">{nuevasPersonas.length} persona{nuevasPersonas.length !== 1 ? 's' : ''} esperando contacto</p>
            </div>
          </div>
          <ul className="divide-y divide-orange-100">
            {nuevasPersonas.map(v => (
              <li key={v.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{v.name}</p>
                  {v.phone && (
                    <a href={`https://wa.me/${v.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                      className="text-xs text-green-600 hover:underline">📱 {v.phone}</a>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(v.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {contactando.has(v.id) ? (
                  <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1 flex-shrink-0">
                    <CheckCircle className="w-3 h-3" /> Contactada
                  </span>
                ) : (
                  <button onClick={() => markAsContacted(v)}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 hover:bg-green-100 hover:text-green-700 transition-colors flex-shrink-0">
                    Por contactar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {submitted && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          <CheckCircle className="w-4 h-4" /> Visitante registrado con éxito
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
            <input required value={form.name} onChange={setF('name')} placeholder="Nombre y apellido"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input value={form.phone} onChange={setF('phone')} placeholder="Ej: 11 1234-5678"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={setF('email')} placeholder="correo@ejemplo.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
            <input type="number" min="1" max="120" value={form.edad} onChange={setF('edad')} placeholder="Ej: 28"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado civil</label>
            <select value={form.estado_civil} onChange={setF('estado_civil')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
              <option value="">Sin especificar</option>
              <option value="Soltero/a">Soltero/a</option>
              <option value="Casado/a">Casado/a</option>
              <option value="Divorciado/a">Divorciado/a</option>
              <option value="Viudo/a">Viudo/a</option>
              <option value="En pareja">En pareja</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barrio / Zona</label>
            <input value={form.barrio} onChange={setF('barrio')} placeholder="Ej: Isidro Casanova"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de visita</label>
            <input type="date" value={form.visit_date} onChange={setF('visit_date')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invitado por</label>
            <input value={form.invited_by} onChange={setF('invited_by')}
              placeholder={`${leader.nombre} ${leader.apellido}`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea value={form.notes} onChange={setF('notes')} rows={2}
              placeholder="Observaciones, necesidades, etc."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
          {saving ? 'Guardando...' : 'Guardar visitante'}
        </button>
      </form>
      {recent.length > 0 && (
        <div className="mt-8">
          <h3 className="text-base font-semibold text-gray-700 mb-3">Últimos visitantes registrados</h3>
          <ul className="space-y-2">
            {recent.map(v => (
              <li key={v.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{v.name}</p>
                  <p className="text-xs text-gray-500">{v.phone || 'Sin teléfono'}</p>
                </div>
                <span className="text-xs text-gray-400">{v.visit_date}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vista de Intercesión (pedidos de oración de la landing)
// ─────────────────────────────────────────────────────────────────────────────
function IntercesionView({ user, churchId, onBack }) {
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('Active');

  useEffect(() => { loadPrayers(); }, [filter]);

  const loadPrayers = async () => {
    setLoading(true);
    try {
      let q = supabase
        .from('prayer_requests')
        .select('id, requester_name, request, category, status, source, phone, email, created_at')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false });

      if (filter !== 'all') q = q.eq('status', filter);

      const { data, error } = await q;
      if (!error) setPrayers(data || []);
    } catch (err) {
      console.error('Error cargando pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('prayer_requests')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('church_id', churchId);
      if (!error) {
        setPrayers(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      }
    } catch (err) {
      console.error('Error actualizando pedido:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const CATEGORY_ES = {
    Health: 'Salud', Family: 'Familia', Financial: 'Finanzas',
    Spiritual: 'Espiritual', Work: 'Trabajo', Relationships: 'Relaciones', Other: 'Otro'
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver al portal
      </button>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Pedidos de Oración</h2>
      <p className="text-sm text-gray-500 mb-6">Pedidos recibidos desde el sitio web y del CRM. Podés marcarlos como respondidos.</p>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[['Active', 'Activos'], ['Answered', 'Respondidos'], ['all', 'Todos']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === val
                ? 'bg-pink-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-pink-300'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-pink-600/30 border-t-pink-600 rounded-full animate-spin" />
        </div>
      ) : prayers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <HandHeart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay pedidos en esta categoría.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {prayers.map(p => (
            <li key={p.id} className={`bg-white rounded-2xl border p-5 ${p.status === 'Answered' ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{p.requester_name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {p.source === 'landing' && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">Desde la web</span>
                    )}
                    {p.category && p.category !== 'Other' && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-medium">{CATEGORY_ES[p.category] || p.category}</span>
                    )}
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-500">
                      {new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                {p.status === 'Answered' ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 flex-shrink-0">
                    <CheckCircle className="w-4 h-4" /> Respondido
                  </span>
                ) : (
                  <button
                    onClick={() => updateStatus(p.id, 'Answered')}
                    disabled={updatingId === p.id}
                    className="flex-shrink-0 px-3 py-1.5 bg-pink-100 hover:bg-green-100 text-pink-700 hover:text-green-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                    {updatingId === p.id ? '...' : 'Marcar respondido'}
                  </button>
                )}
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Pedido de oración</p>
              <p className="text-sm text-gray-700 leading-relaxed">{p.request}</p>
              {(p.phone || p.email) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.phone && (
                    <a href={`https://wa.me/${p.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                      className="text-xs text-green-600 hover:underline">📱 {p.phone}</a>
                  )}
                  {p.email && (
                    <a href={`mailto:${p.email}`} className="text-xs text-blue-600 hover:underline">✉ {p.email}</a>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vista genérica de materiales por área de servicio
// Se usa para todas las áreas que no tienen vista especial (no Consolidación/Intercesión)
// ─────────────────────────────────────────────────────────────────────────────
function AreaMaterialesView({ areaName, churchId, userId, onBack }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const areaConfig = AREA_PORTAL_SECTIONS[areaName];

  useEffect(() => { loadMaterials(); }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leader_materials')
        .select('id, title, description, category, type, url, file_size, created_at')
        .eq('church_id', churchId)
        .eq('service_area', areaName)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setMaterials(data);
        // Marcar como vistos
        if (data.length > 0 && userId) {
          const rows = data.map(m => ({ user_id: userId, notification_id: m.id }));
          // No bloquea si falla
        }
      }
    } catch (err) {
      console.error('Error cargando materiales del área:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const Icon = areaConfig?.icon ?? BookOpen;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver al portal
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${areaConfig?.color ?? 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{areaConfig?.view ? `Materiales de ${areaName}` : (areaConfig?.title ?? areaName)}</h2>
          <p className="text-sm text-gray-500">Materiales y recursos del área</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Sin materiales todavía</p>
          <p className="text-gray-400 text-xs mt-1">El pastor cargará recursos para esta área próximamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map(m => (
            <a
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${areaConfig?.color ?? 'from-gray-400 to-gray-500'} flex items-center justify-center flex-shrink-0`}>
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{m.title}</p>
                {m.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{m.description}</p>}
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {m.category && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-medium">{m.category}</span>
                  )}
                  {m.file_size && (
                    <span className="text-[10px] text-gray-400">{formatSize(m.file_size)}</span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {new Date(m.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Gestión de accesos de la célula (vista del líder)
// ─────────────────────────────────────────────────────────────────────────────
function CelularAccessView({ leader, onBack }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState(null);
  const [invitedIds, setInvitedIds] = useState(new Set());
  const [errors, setErrors] = useState({});

  const PORTAL_AREAS_LIST = Object.keys(AREA_PORTAL_SECTIONS);

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    try {
      const { data } = await supabase
        .from('personas')
        .select('id, nombre, apellido, email, area_servicio_actual')
        .eq('lider_id', leader.id)
        .not('area_servicio_actual', 'is', null);

      const filtered = (data || []).filter(p => {
        const areas = (p.area_servicio_actual || '').split(',').map(a => a.trim());
        return areas.some(a => PORTAL_AREAS_LIST.includes(a));
      });
      setMembers(filtered);
    } catch (err) {
      console.error('Error cargando miembros:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPortalAreas = (area_str) =>
    (area_str || '').split(',').map(a => a.trim()).filter(a => PORTAL_AREAS_LIST.includes(a));

  const handleInvite = async (persona) => {
    if (!persona.email) {
      setErrors(prev => ({ ...prev, [persona.id]: 'Sin email — actualizá sus datos primero' }));
      return;
    }
    setInvitingId(persona.id);
    setErrors(prev => { const n = { ...prev }; delete n[persona.id]; return n; });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/connect/invite-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          personaId: persona.id,
          email: persona.email,
          fullName: `${persona.nombre} ${persona.apellido}`.trim(),
          redirectBase: window.location.origin,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setInvitedIds(prev => new Set([...prev, persona.id]));
    } catch (err) {
      setErrors(prev => ({ ...prev, [persona.id]: err.message }));
    } finally {
      setInvitingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-4 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver al portal
      </button>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Accesos de mi célula</h2>
      <p className="text-sm text-gray-500 mb-6">
        Miembros de tu célula que sirven en áreas con acceso al portal. Presioná "Dar acceso" para enviarles el email de invitación.
      </p>

      {members.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Ningún miembro de tu célula tiene áreas con acceso al portal todavía.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {members.map(m => {
            const portalAreas = getPortalAreas(m.area_servicio_actual);
            const invited = invitedIds.has(m.id);
            const errMsg = errors[m.id];
            return (
              <li key={m.id} className="bg-white border border-gray-200 rounded-xl px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{m.nombre} {m.apellido}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {m.email || <span className="text-red-500">Sin email</span>}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {portalAreas.map(a => (
                        <span key={a} className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-[10px] font-semibold border border-teal-100">{a}</span>
                      ))}
                    </div>
                  </div>
                  {invited ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 whitespace-nowrap flex-shrink-0">
                      <CheckCircle className="w-4 h-4" /> Enviado
                    </span>
                  ) : (
                    <button
                      onClick={() => handleInvite(m)}
                      disabled={invitingId === m.id || !m.email}
                      className="flex-shrink-0 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      {invitingId === m.id ? 'Enviando...' : 'Dar acceso'}
                    </button>
                  )}
                </div>
                {errMsg && <p className="text-xs text-red-500 mt-2">{errMsg}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vista de eventos — calendario mensual con dots en días con eventos
// ─────────────────────────────────────────────────────────────────────────────
const EVENT_TYPE_CONFIG = {
  general:  { label: "General",   color: "bg-blue-100 text-blue-700",   dot: "bg-blue-500" },
  special:  { label: "Especial",  color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  youth:    { label: "Jóvenes",   color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  worship:  { label: "Adoración", color: "bg-pink-100 text-pink-700",   dot: "bg-pink-500" },
  missions: { label: "Misiones",  color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  training: { label: "Formación", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
};
const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function EventosView({ churchId, onBack }) {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    fetch(`/api/church-events?church_id=${churchId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setAllEvents(Array.isArray(data) ? data : []))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [churchId]);

  // Días del grid del mes (null = celda vacía de relleno)
  const calendarDays = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const first = new Date(y, m, 1);
    const last  = new Date(y, m + 1, 0);
    // Semana empieza en lunes: lunes=0 … domingo=6
    const startOffset = (first.getDay() + 6) % 7;
    const days = Array(startOffset).fill(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(y, m, d));
    return days;
  }, [currentMonth]);

  // Eventos que caen en un día (incluyendo eventos multi-día)
  const eventsForDate = (date) => {
    if (!date) return [];
    const d = date.getTime();
    return allEvents.filter(e => {
      const s = new Date(e.starts_at); s.setHours(0, 0, 0, 0);
      const en = new Date(e.ends_at || e.starts_at); en.setHours(23, 59, 59, 999);
      return d >= s.getTime() && d <= en.getTime();
    });
  };

  const isSameDay = (a, b) =>
    a && b && a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const isToday = (date) => date && isSameDay(date, new Date());

  const prevMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const monthLabel = currentMonth.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  const formatDateRange = (starts, ends) => {
    const s = new Date(starts);
    if (!ends) return s.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const e = new Date(ends);
    if (s.toDateString() === e.toDateString())
      return s.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    return `${s.toLocaleDateString("es-AR", { day: "numeric" })} al ${e.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}`;
  };

  const formatTime = (starts) => {
    const s = new Date(starts);
    if (s.getHours() === 0 && s.getMinutes() === 0) return null;
    return s.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  };

  // Próximos eventos globales (cuando no hay día seleccionado)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return [...allEvents]
      .filter(e => new Date(e.ends_at || e.starts_at) >= now)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }, [allEvents]);

  const selectedEvents = selectedDay ? eventsForDate(selectedDay) : [];

  const EventCard = ({ e }) => {
    const typeConf = EVENT_TYPE_CONFIG[e.type] ?? { label: e.type, color: "bg-gray-100 text-gray-600" };
    const time = formatTime(e.starts_at);
    return (
      <li className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">{e.title}</p>
            <p className="text-sm text-red-600 font-medium mt-0.5 capitalize">
              {formatDateRange(e.starts_at, e.ends_at)}{time && ` · ${time} hs`}
            </p>
          </div>
          <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeConf.color}`}>
            {typeConf.label}
          </span>
        </div>
        {e.description && <p className="text-sm text-gray-600 mt-2">{e.description}</p>}
        <div className="flex items-center justify-between gap-2 mt-3">
          {e.location && <p className="text-xs text-gray-400">📍 {e.location}</p>}
          {e.contact_url && (
            <a href={e.contact_url} target="_blank" rel="noreferrer"
              className="text-xs font-semibold text-green-600 hover:text-green-700">
              💬 Más info
            </a>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver al portal
      </button>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Eventos</h2>
      <p className="text-sm text-gray-500 mb-5">Actividades y eventos de la iglesia</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : fetchError ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No se pudieron cargar los eventos.</p>
        </div>
      ) : (
        <>
          {/* ── Calendario ── */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6 shadow-sm">
            {/* Navegación de mes — fondo rojo */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-red-600 to-red-700">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-bold text-white capitalize tracking-wide">{monthLabel}</span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Cabecera de días */}
            <div className="grid grid-cols-7 bg-red-50 border-b border-red-100">
              {DAY_NAMES.map(d => (
                <div key={d} className="py-2 text-center text-[11px] font-bold text-red-400 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, i) => {
                const dayEvents = date ? eventsForDate(date) : [];
                const selected  = isSameDay(date, selectedDay);
                const today     = isToday(date);
                const hasEv     = dayEvents.length > 0;

                return (
                  <button
                    key={i}
                    disabled={!date}
                    onClick={() => {
                      if (!date) return;
                      setSelectedDay(isSameDay(date, selectedDay) ? null : date);
                    }}
                    className={`relative flex flex-col items-center pt-2 pb-3 min-h-[52px] transition-colors
                      ${!date ? "cursor-default" : "hover:bg-red-50 cursor-pointer"}
                      ${selected ? "bg-red-50" : ""}
                      ${i % 7 !== 6 ? "border-r border-gray-50" : ""}
                      ${i < calendarDays.length - 7 ? "border-b border-gray-50" : ""}
                    `}
                  >
                    {date && (
                      <>
                        <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors
                          ${selected ? "bg-red-600 text-white font-bold" : today ? "bg-red-100 text-red-700 font-bold" : "text-gray-700"}
                        `}>
                          {date.getDate()}
                        </span>
                        {/* Dots de eventos (máx 3) */}
                        {hasEv && (
                          <div className="flex gap-0.5 mt-1">
                            {dayEvents.slice(0, 3).map((e, j) => {
                              const dotColor = (EVENT_TYPE_CONFIG[e.type] ?? { dot: "bg-red-500" }).dot;
                              return <span key={j} className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />;
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Panel inferior: eventos del día seleccionado o próximos ── */}
          {selectedDay ? (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 capitalize">
                {selectedDay.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              {selectedEvents.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl border border-gray-200">
                  <p className="text-gray-400 text-sm">Sin eventos este día.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {selectedEvents.map(e => <EventCard key={e.id} e={e} />)}
                </ul>
              )}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border border-gray-200">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No hay eventos próximos.</p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Próximos eventos</p>
              <ul className="space-y-3">
                {upcomingEvents.map(e => <EventCard key={e.id} e={e} />)}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard principal
// ─────────────────────────────────────────────────────────────────────────────
export default function PortalDashboard() {
  const [user, setUser] = useState(null);
  const [churchId, setChurchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadMaterials, setUnreadMaterials] = useState(0);
  const [unreadList, setUnreadList] = useState([]);
  const [newPrayers, setNewPrayers] = useState(0);
  const [eventNotifications, setEventNotifications] = useState([]);
  const [materialNotifications, setMaterialNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [activeView, setActiveView] = useState(() => {
    // Si viene con ?view=consolidacion (desde login de miembro de servicio), abrir directo
    if (typeof window !== 'undefined') {
      const v = new URLSearchParams(window.location.search).get('view');
      if (v) return v;
    }
    return 'home';
  });
  const [stats, setStats] = useState({ recentReports: 0, cellMembers: 0, prayerRequests: 0 });
  const [cellPortalMembers, setCellPortalMembers] = useState([]);
  const [pendingWebVisitors, setPendingWebVisitors] = useState(0);

  const redirect = (path) => { window.location.href = path; };

  const userPortalAreas = user
    ? (user.area_servicio_actual || '').split(',').map(a => a.trim()).filter(a => AREA_PORTAL_SECTIONS[a])
    : [];
  const isLider = user?.rol === 'Líder' || user?.rol === 'Pastor';
  const isServicio = !isLider && userPortalAreas.length > 0;

  const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000;

  useEffect(() => { verifyAndLoad(); }, []);

  const verifyAndLoad = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { redirect("/connect/portal/login"); return; }

      const loginAt = new Date(session.user.last_sign_in_at).getTime();
      if (Date.now() - loginAt > SESSION_MAX_AGE_MS) {
        await supabase.auth.signOut();
        redirect("/connect/portal/login");
        return;
      }

      const cid = await getCurrentChurchId();
      setChurchId(cid);
      const userEmail = session.user.email?.toLowerCase().trim();

      const superadmin = await checkIsSuperadmin();
      if (superadmin) {
        setUser({ id: null, nombre: 'Superadmin', apellido: '', email: userEmail, rol: 'superadmin', area_servicio_actual: '' });
        await loadUnreadCount(cid, session.user.id);
        setLoading(false);
        return;
      }

      const { data: persona, error } = await supabase
        .from('personas')
        .select('id, nombre, apellido, email, grupo_celula, foto_url, rol, estado_aprobacion, area_servicio_actual')
        .eq('church_id', cid)
        .ilike('email', userEmail)
        .single();

      if (error || !persona) {
        await supabase.auth.signOut();
        redirect("/connect/portal/login");
        return;
      }

      const areas = (persona.area_servicio_actual || '').split(',').map(a => a.trim());
      const hasPortalArea = areas.some(a => AREA_PORTAL_SECTIONS[a]);
      const isApprovedLider = (persona.rol === 'Líder' && persona.estado_aprobacion === 'aprobado') || persona.rol === 'Pastor';

      if (!isApprovedLider && !hasPortalArea) {
        await supabase.auth.signOut();
        redirect("/connect/portal/login");
        return;
      }

      setUser(persona);
      if (persona.rol === 'Líder' || persona.rol === 'Pastor') {
        await loadStats(persona.id, userEmail);
        await loadCellPortalMembers(persona.id, cid);
      }
      await loadUnreadCount(cid, session.user.id);
      await loadEventNotifications(cid, session.user.id);
      await loadAreaMaterialNotifications(cid, session.user.id, areas.filter(a => AREA_PORTAL_SECTIONS[a]));
      if (areas.some(a => a === 'Intercesión')) {
        await loadNewPrayers(cid);
      }
      if (areas.some(a => a === 'Consolidación') || isApprovedLider) {
        await loadPendingWebVisitors(cid);
      }

    } catch (err) {
      console.error("Error verificando usuario:", err);
      await supabase.auth.signOut();
      redirect("/connect/portal/login");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingWebVisitors = async (cid) => {
    try {
      const { count } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', cid)
        .eq('invited_by', 'web:soy-nuevo')
        .eq('follow_up_status', 'Pending');
      setPendingWebVisitors(count || 0);
    } catch (err) { console.error('Error cargando visitantes web pendientes:', err); }
  };

  const loadNewPrayers = async (cid) => {
    try {
      const { count } = await supabase
        .from('prayer_requests')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', cid)
        .eq('status', 'Active');
      setNewPrayers(count || 0);
    } catch (err) { console.error('Error cargando pedidos activos:', err); }
  };

  const loadEventNotifications = async (cid, userId) => {
    try {
      const { data: notifications } = await supabase
        .from('portal_notifications')
        .select('id, title, body, image_url, created_at')
        .eq('type', 'event')
        .eq('target', 'all')
        .or(`church_id.is.null,church_id.eq.${cid}`)
        .order('created_at', { ascending: false })
        .limit(15);
      if (!notifications?.length) return;
      const { data: reads } = await supabase
        .from('portal_notification_reads')
        .select('notification_id')
        .eq('user_id', userId);
      const readIds = new Set((reads || []).map(r => r.notification_id));
      setEventNotifications(notifications.filter(n => !readIds.has(n.id)));
    } catch (err) { console.error('Error cargando notificaciones de eventos:', err); }
  };

  const markEventNotificationsRead = async () => {
    if (!eventNotifications.length) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const rows = eventNotifications.map(n => ({ user_id: session.user.id, notification_id: n.id }));
      await supabase
        .from('portal_notification_reads')
        .upsert(rows, { onConflict: 'user_id,notification_id', ignoreDuplicates: true });
      setEventNotifications([]);
    } catch (err) { console.error('Error marcando notificaciones leídas:', err); }
  };

  const loadAreaMaterialNotifications = async (cid, userId, areas) => {
    if (!areas?.length) return;
    try {
      const { data: notifications } = await supabase
        .from('portal_notifications')
        .select('id, title, body, target, created_at')
        .eq('type', 'material')
        .eq('church_id', cid)
        .in('target', areas)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!notifications?.length) return;
      const { data: reads } = await supabase
        .from('portal_notification_reads')
        .select('notification_id')
        .eq('user_id', userId);
      const readIds = new Set((reads || []).map(r => r.notification_id));
      setMaterialNotifications(notifications.filter(n => !readIds.has(n.id)));
    } catch (err) { console.error('Error cargando notificaciones de materiales:', err); }
  };

  const markMaterialNotificationsRead = async () => {
    if (!materialNotifications.length) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const rows = materialNotifications.map(n => ({ user_id: session.user.id, notification_id: n.id }));
      await supabase
        .from('portal_notification_reads')
        .upsert(rows, { onConflict: 'user_id,notification_id', ignoreDuplicates: true });
      setMaterialNotifications([]);
    } catch (err) { console.error('Error marcando notif materiales leídas:', err); }
  };

  const loadUnreadCount = async (cid, userId) => {
    try {
      const { data: allMaterials } = await supabase
        .from('leader_materials')
        .select('id, title, category, created_at')
        .eq('church_id', cid)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (!allMaterials?.length) return;
      const { data: viewed } = await supabase
        .from('leader_material_views')
        .select('material_id')
        .eq('user_id', userId);
      const viewedIds = new Set((viewed || []).map(v => v.material_id));
      const unread = allMaterials.filter(m => !viewedIds.has(m.id));
      setUnreadList(unread);
      setUnreadMaterials(unread.length);
    } catch (err) { console.error("Error cargando no leídos:", err); }
  };

  const loadCellPortalMembers = async (leaderId, cid) => {
    try {
      const portalAreasList = Object.keys(AREA_PORTAL_SECTIONS);
      const { data } = await supabase
        .from('personas')
        .select('id, nombre, apellido, email, area_servicio_actual')
        .eq('lider_id', leaderId)
        .eq('church_id', cid)
        .not('area_servicio_actual', 'is', null);
      const filtered = (data || []).filter(p => {
        const areas = (p.area_servicio_actual || '').split(',').map(a => a.trim());
        return areas.some(a => portalAreasList.includes(a));
      });
      setCellPortalMembers(filtered);
    } catch (err) { console.error('Error cargando miembros con áreas portal:', err); }
  };

  const loadStats = async (leaderId, leaderEmail) => {    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: reportsCount } = await supabase
        .from('leader_cell_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('leader_id', leaderId)
        .gte('report_date', thirtyDaysAgo.toISOString().split('T')[0]);
      const { count: membersCount } = await supabase
        .from('personas')
        .select('*', { count: 'exact', head: true })
        .eq('lider_id', leaderId);
      const { count: prayersCount } = await supabase
        .from('leader_prayer_requests')
        .select('*', { count: 'exact', head: true })
        .eq('leader_email', leaderEmail)
        .eq('status', 'active');
      setStats({ recentReports: reportsCount || 0, cellMembers: membersCount || 0, prayerRequests: prayersCount || 0 });
    } catch (err) { console.error("Error loading stats:", err); }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (file.size > 5 * 1024 * 1024) { alert("La foto no puede superar 5MB"); return; }
    setPhotoUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${churchId}/${user.id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('leader-photos').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('leader-photos').getPublicUrl(path);
      await supabase.from('personas').update({ foto_url: publicUrl }).eq('id', user.id);
      await supabase.from('leaders').update({ photo: publicUrl }).ilike('email', user.email);
      setUser(prev => ({ ...prev, foto_url: publicUrl }));
    } catch (err) {
      console.error('Error al subir foto:', err);
      alert('No se pudo actualizar la foto.');
    } finally { setPhotoUploading(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    redirect("/connect/portal/login");
  };

  useEffect(() => {
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const leaderMenuItems = [
    { title: "Cargar Reporte", description: "Reportar asistencia, ofrendas y testimonios", icon: FileText, href: "/connect/portal/reportes", color: "from-blue-500 to-blue-600", badge: stats.recentReports > 0 ? `${stats.recentReports} este mes` : null },
    { title: "Eventos", description: "Próximas actividades de la iglesia", icon: Calendar, href: null, action: () => setActiveView("eventos"), color: "from-sky-500 to-sky-600" },
    { title: "Materiales", description: "Accede a recursos y capacitaciones", icon: BookOpen, href: "/connect/portal/materiales", color: "from-purple-500 to-purple-600", badge: unreadMaterials > 0 ? `${unreadMaterials} nuevo${unreadMaterials > 1 ? 's' : ''}` : null, badgeNew: unreadMaterials > 0 },
    { title: "Mis Miembros", description: "Lista de miembros de tu célula", icon: Users, href: "/connect/portal/miembros", color: "from-green-500 to-green-600", badge: stats.cellMembers > 0 ? `${stats.cellMembers} personas` : null },

    { title: "Accesos de Célula", description: "Dar acceso al portal a tus miembros de servicio", icon: ShieldCheck, href: null, action: () => setActiveView('accesos-celula'), color: "from-teal-500 to-teal-600", badge: cellPortalMembers.length > 0 ? `${cellPortalMembers.length} miembro${cellPortalMembers.length > 1 ? 's' : ''}` : null },
    ...userPortalAreas.map(area => {
      const section = AREA_PORTAL_SECTIONS[area];
      const badge =
        area === 'Intercesión' && newPrayers > 0 ? `${newPrayers} activo${newPrayers > 1 ? 's' : ''}` :
        area === 'Consolidación' && pendingWebVisitors > 0 ? `${pendingWebVisitors} nuevo${pendingWebVisitors > 1 ? 's' : ''}` :
        null;
      // Si el área tiene vista especial definida (consolidacion/intercesion), usarla;
      // si no, usar la vista genérica de materiales del área.
      const viewTarget = section.view ?? `area:${area}`;
      return { title: section.title, description: section.description, icon: section.icon, href: null, action: () => setActiveView(viewTarget), color: section.color, badge, badgeNew: badge != null };
    }),
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user?.id && (
              <label className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 cursor-pointer flex-shrink-0 group" title="Cambiar foto">
                {user.foto_url ? (
                  <img src={user.foto_url} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                    {user.nombre?.[0]}{user.apellido?.[0]}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                  {photoUploading
                    ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    : <span className="text-white text-[9px] font-bold text-center leading-tight px-1">Cambiar</span>
                  }
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={photoUploading} />
              </label>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Portal CFC</h1>
              <p className="text-sm text-gray-600 mt-1">Hola, {user?.nombre} {user?.apellido}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(isLider || isServicio) && (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => {
                    const opening = !bellOpen;
                    setBellOpen(o => !o);
                    if (opening && eventNotifications.length > 0) markEventNotificationsRead();
                    if (opening && materialNotifications.length > 0) markMaterialNotificationsRead();
                  }}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Notificaciones"
                >
                  <Bell className="w-5 h-5 text-gray-700" />
                  {(unreadMaterials + eventNotifications.length + materialNotifications.length) > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadMaterials + eventNotifications.length + materialNotifications.length}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-semibold text-gray-900 text-sm">Notificaciones</span>
                      {(unreadMaterials + eventNotifications.length + materialNotifications.length) > 0 && <span className="text-xs text-red-600 font-medium">{unreadMaterials + eventNotifications.length + materialNotifications.length} pendientes</span>}
                    </div>
                    {/* Eventos nuevos — para todos los usuarios del portal */}
                    {eventNotifications.map(n => (
                      <div key={n.id} className="px-4 py-3 flex items-start gap-3 border-b border-gray-100 bg-blue-50/50">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                          {n.body && <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.body}</p>}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(n.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      </div>
                    ))}
                    {/* Materiales de área — para miembros de servicio */}
                    {materialNotifications.map(n => {
                      const section = AREA_PORTAL_SECTIONS[n.target];
                      return (
                        <button key={n.id}
                          onClick={() => { setBellOpen(false); setActiveView(`area:${n.target}`); }}
                          className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors flex items-start gap-3 border-b border-gray-100">
                          <div className={`w-8 h-8 bg-gradient-to-br ${section?.color ?? 'from-orange-400 to-orange-500'} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <BookOpen className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                            {n.body && <p className="text-xs text-gray-600 mt-0.5">{n.body}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(n.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                            </p>
                          </div>
                          <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2" />
                        </button>
                      );
                    })}
                    {/* Pedidos de oración activos — para intercesores */}
                    {newPrayers > 0 && (
                      <button onClick={() => { setBellOpen(false); setActiveView('intercesion'); }}
                        className="w-full text-left px-4 py-3 hover:bg-pink-50 transition-colors flex items-start gap-3 border-b border-gray-100">
                        <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <HandHeart className="w-4 h-4 text-pink-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">Pedidos de Oración</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            <span className="text-pink-600 font-medium">{newPrayers} pedido{newPrayers > 1 ? 's' : ''} activo{newPrayers > 1 ? 's' : ''}</span> esperando intercesión
                          </p>
                        </div>
                        <span className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0 mt-2" />
                      </button>
                    )}
                    {/* Materiales no leídos — para líderes */}
                    {unreadList.length === 0 && eventNotifications.length === 0 && materialNotifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">Todo al día, no hay novedades.</div>
                    ) : isLider && unreadList.length === 0 ? (
                      <div className="px-4 py-4 text-center text-sm text-gray-500">No hay materiales nuevos.</div>
                    ) : isLider ? (
                      <ul>
                        {unreadList.map(m => (
                          <li key={m.id}>
                            <button onClick={() => { setBellOpen(false); redirect("/connect/portal/materiales"); }}
                              className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <BookOpen className="w-4 h-4 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {m.category && <span className="text-purple-600">{m.category} · </span>}
                                  Nuevo material disponible
                                </p>
                              </div>
                              <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {isLider && (
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                        <button onClick={() => { setBellOpen(false); redirect("/connect/portal/materiales"); }} className="text-xs text-purple-600 font-medium hover:text-purple-700 w-full text-center py-1">
                          Ver todos los materiales →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* ── VISTA EVENTOS ── */}
        {activeView === "eventos" && (
          <EventosView churchId={churchId} onBack={() => setActiveView("home")} />
        )}

        {/* ── VISTA ÁREA ACTIVA ── */}
        {activeView === 'consolidacion' && (
          <ConsolidacionView
            leader={user}
            churchId={churchId}
            onBack={() => setActiveView('home')}
          />
        )}

        {/* ── VISTA ACCESOS DE CÉLULA ── */}
        {activeView === 'accesos-celula' && (
          <CelularAccessView
            leader={user}
            onBack={() => setActiveView('home')}
          />
        )}

        {/* ── VISTA INTERCESIÓN ── */}
        {activeView === 'intercesion' && (
          <IntercesionView
            user={user}
            churchId={churchId}
            onBack={() => setActiveView('home')}
          />
        )}

        {/* ── VISTA MATERIALES POR ÁREA (áreas sin vista especial) ── */}
        {activeView.startsWith('area:') && (() => {
          const areaName = activeView.replace('area:', '');
          return (
            <AreaMaterialesView
              areaName={areaName}
              churchId={churchId}
              userId={user?.id}
              onBack={() => setActiveView('home')}
            />
          );
        })()}

        {/* ── VISTA INICIO LÍDER ── */}
        {activeView === 'home' && isLider && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-gray-600">Reportes (30 días)</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.recentReports}</p></div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><BarChart3 className="w-6 h-6 text-blue-600" /></div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-gray-600">Miembros de célula</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.cellMembers}</p></div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><Users className="w-6 h-6 text-green-600" /></div>
                </div>
              </div>
              {userPortalAreas.includes('Intercesión') && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-600">Pedidos activos</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.prayerRequests}</p></div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center"><Heart className="w-6 h-6 text-red-600" /></div>
                  </div>
                </div>
              )}
              {userPortalAreas.includes('Consolidación') && (
                <div className={`bg-white rounded-xl p-6 shadow-sm border ${pendingWebVisitors > 0 ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Visitantes web</p>
                      <p className={`text-3xl font-bold mt-1 ${pendingWebVisitors > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{pendingWebVisitors}</p>
                      {pendingWebVisitors > 0 && <p className="text-xs text-orange-500 mt-0.5">sin contactar</p>}
                    </div>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${pendingWebVisitors > 0 ? 'bg-orange-100' : 'bg-orange-50'}`}>
                      <UserPlus className={`w-6 h-6 ${pendingWebVisitors > 0 ? 'text-orange-600' : 'text-orange-400'}`} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {leaderMenuItems.map((item) => (
                <button key={item.title} onClick={() => item.action ? item.action() : redirect(item.href)}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 text-left group">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  {item.badge && (
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${item.badgeNew ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── VISTA INICIO MIEMBRO DE SERVICIO (sin rol Líder, solo áreas) ── */}
        {activeView === 'home' && isServicio && (
          <div className="max-w-2xl mx-auto">
            <p className="text-sm text-gray-500 mb-6">Accesos disponibles para tu área de servicio:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Eventos — siempre visible para todos */}
              <button onClick={() => setActiveView("eventos")}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 text-left group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Eventos</h3>
                <p className="text-sm text-gray-600">Próximas actividades de la iglesia</p>
              </button>
              {userPortalAreas.flatMap(area => {
                const section = AREA_PORTAL_SECTIONS[area];
                const areaBadge = area === 'Intercesión' && newPrayers > 0 ? `${newPrayers} activo${newPrayers > 1 ? 's' : ''}` : null;
                const viewTarget = section.view ?? `area:${area}`;
                const cards = [
                  <button key={area} onClick={() => setActiveView(viewTarget)}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 text-left group">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <section.icon className="w-7 h-7 text-white" />
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{section.title}</h3>
                    <p className="text-sm text-gray-600">{section.description}</p>
                    {areaBadge && (
                      <span className="inline-block mt-3 px-3 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-700">
                        {areaBadge}
                      </span>
                    )}
                  </button>
                ];
                // Si el área tiene una vista especial, agregar también card de Materiales
                if (section.view) {
                  cards.push(
                    <button key={`${area}-materiales`} onClick={() => setActiveView(`area:${area}`)}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 text-left group">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <BookOpen className="w-7 h-7 text-white" />
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Materiales {area}</h3>
                      <p className="text-sm text-gray-600">Recursos y documentación del área</p>
                    </button>
                  );
                }
                return cards;
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
