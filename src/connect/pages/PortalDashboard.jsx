"use client";

import { useState, useEffect, useRef } from "react";
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
  ArrowLeft
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO CENTRAL DE SECCIONES POR ÁREA
// Para agregar una nueva área con portal: agregar una entrada acá.
// "key" debe coincidir EXACTAMENTE con el tag en area_servicio_actual.
// ─────────────────────────────────────────────────────────────────────────────
const AREA_PORTAL_SECTIONS = {
  'Consolidación': {
    key: 'consolidacion',
    title: 'Registrar Visitante',
    description: 'Anotar datos de nuevos visitantes',
    icon: UserPlus,
    color: 'from-orange-500 to-orange-600',
  },
  // Futuras áreas — descomentar y agregar vista cuando corresponda:
  // 'Alabanza': { key: 'alabanza', title: 'Alabanza', description: '...', icon: Music, color: 'from-yellow-500 to-yellow-600' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Formulario de Consolidación (componente inline)
// ─────────────────────────────────────────────────────────────────────────────
function ConsolidacionView({ leader, churchId, onBack }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    visit_date: new Date().toISOString().slice(0, 10),
    invited_by: '', notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recent, setRecent] = useState([]);

  const setF = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  useEffect(() => { loadRecent(); }, []);

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
        invited_by: form.invited_by || `${leader.nombre} ${leader.apellido}`.trim(),
        notes: form.notes || null,
        follow_up_status: 'Pending',
        church_id: churchId,
      }]);
      if (error) throw error;
      setForm({ name: '', phone: '', email: '', visit_date: new Date().toISOString().slice(0, 10), invited_by: '', notes: '' });
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
// Dashboard principal
// ─────────────────────────────────────────────────────────────────────────────
export default function PortalDashboard() {
  const [user, setUser] = useState(null);
  const [churchId, setChurchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadMaterials, setUnreadMaterials] = useState(0);
  const [unreadList, setUnreadList] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [activeView, setActiveView] = useState('home');
  const [stats, setStats] = useState({ recentReports: 0, cellMembers: 0, prayerRequests: 0 });

  const redirect = (path) => { window.location.href = path; };

  const userPortalAreas = user
    ? (user.area_servicio_actual || '').split(',').map(a => a.trim()).filter(a => AREA_PORTAL_SECTIONS[a])
    : [];
  const isLider = user?.rol === 'Líder';
  const isServicio = !isLider && userPortalAreas.length > 0;

  const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000;

  useEffect(() => { verifyAndLoad(); }, []);

  const verifyAndLoad = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { redirect("/connect/portal/login"); return; }

      const loginAt = new Date(session.user.last_sign_in_at).getTime();
      if (Date.now() - loginAt > SESSION_MAX_AGE_MS) {
        supabase.auth.signOut();
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
        supabase.auth.signOut();
        redirect("/connect/portal/login");
        return;
      }

      const areas = (persona.area_servicio_actual || '').split(',').map(a => a.trim());
      const hasPortalArea = areas.some(a => AREA_PORTAL_SECTIONS[a]);
      const isApprovedLider = persona.rol === 'Líder' && persona.estado_aprobacion === 'aprobado';

      if (!isApprovedLider && !hasPortalArea) {
        supabase.auth.signOut();
        redirect("/connect/portal/login");
        return;
      }

      setUser(persona);
      if (persona.rol === 'Líder') await loadStats(persona.id, userEmail);
      await loadUnreadCount(cid, session.user.id);

    } catch (err) {
      console.error("Error verificando usuario:", err);
      supabase.auth.signOut();
      redirect("/connect/portal/login");
    } finally {
      setLoading(false);
    }
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

  const loadStats = async (leaderId, leaderEmail) => {
    try {
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
    { title: "Materiales", description: "Accede a recursos y capacitaciones", icon: BookOpen, href: "/connect/portal/materiales", color: "from-purple-500 to-purple-600", badge: unreadMaterials > 0 ? `${unreadMaterials} nuevo${unreadMaterials > 1 ? 's' : ''}` : null, badgeNew: unreadMaterials > 0 },
    { title: "Mis Miembros", description: "Lista de miembros de tu célula", icon: Users, href: "/connect/portal/miembros", color: "from-green-500 to-green-600", badge: stats.cellMembers > 0 ? `${stats.cellMembers} personas` : null },
    { title: "Pedidos de Oración", description: "Ver y agregar pedidos de oración", icon: Heart, href: "/connect/portal/oracion", color: "from-red-500 to-red-600", badge: stats.prayerRequests > 0 ? `${stats.prayerRequests} activos` : null },
    ...userPortalAreas.map(area => {
      const section = AREA_PORTAL_SECTIONS[area];
      return { title: section.title, description: section.description, icon: section.icon, href: null, action: () => setActiveView(section.key), color: section.color, badge: null };
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
            {isLider && (
              <div className="relative" ref={bellRef}>
                <button onClick={() => setBellOpen(o => !o)} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Notificaciones">
                  <Bell className="w-5 h-5 text-gray-700" />
                  {unreadMaterials > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadMaterials}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-semibold text-gray-900 text-sm">Notificaciones</span>
                      {unreadMaterials > 0 && <span className="text-xs text-red-600 font-medium">{unreadMaterials} sin leer</span>}
                    </div>
                    {unreadList.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">Todo al día, no hay materiales nuevos.</div>
                    ) : (
                      <ul>
                        {unreadList.map(m => (
                          <li key={m.id}>
                            <button onClick={() => redirect("/connect/portal/materiales")}
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
                    )}
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                      <button onClick={() => redirect("/connect/portal/materiales")} className="text-xs text-purple-600 font-medium hover:text-purple-700 w-full text-center py-1">
                        Ver todos los materiales →
                      </button>
                    </div>
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

        {/* ── VISTA ÁREA ACTIVA ── */}
        {activeView !== 'home' && activeView === 'consolidacion' && (
          <ConsolidacionView
            leader={user}
            churchId={churchId}
            onBack={isLider ? () => setActiveView('home') : null}
          />
        )}

        {/* ── VISTA INICIO LÍDER ── */}
        {activeView === 'home' && isLider && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-gray-600">Pedidos activos</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.prayerRequests}</p></div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center"><Heart className="w-6 h-6 text-red-600" /></div>
                </div>
              </div>
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
              {userPortalAreas.map(area => {
                const section = AREA_PORTAL_SECTIONS[area];
                return (
                  <button key={area} onClick={() => setActiveView(section.key)}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 text-left group">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <section.icon className="w-7 h-7 text-white" />
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{section.title}</h3>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
