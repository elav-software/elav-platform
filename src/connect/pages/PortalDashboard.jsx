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
  Bell
} from "lucide-react";

export default function PortalDashboard() {
  const [leader, setLeader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadMaterials, setUnreadMaterials] = useState(0);
  const [unreadList, setUnreadList] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);
  const [stats, setStats] = useState({
    recentReports: 0,
    cellMembers: 0,
    prayerRequests: 0
  });

  const redirect = (path) => { window.location.href = path; };

  useEffect(() => {
    verifyAndLoadLeader();
  }, []);

  const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 horas

  const verifyAndLoadLeader = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        redirect("/connect/portal/login");
        return;
      }

      // Verificar expiración de 4hs por código
      const loginAt = new Date(session.user.last_sign_in_at).getTime();
      if (Date.now() - loginAt > SESSION_MAX_AGE_MS) {
        supabase.auth.signOut(); // fire-and-forget
        redirect("/connect/portal/login");
        return;
      }

      const churchId = await getCurrentChurchId();
      const userEmail = session.user.email?.toLowerCase().trim();

      // Superadmin bypass — acceso directo sin verificar persona
      const superadmin = await checkIsSuperadmin();
      if (superadmin) {
        setLeader({ id: null, nombre: 'Superadmin', apellido: '', email: userEmail, grupo_celula: null });
        await loadUnreadCount(churchId, session.user.id);
        setLoading(false);
        return;
      }
      
      // Verificar líder aprobado (case-insensitive)
      const { data: leaderData, error } = await supabase
        .from('personas')
        .select('id, nombre, apellido, email, grupo_celula')
        .eq('church_id', churchId)
        .ilike('email', userEmail)
        .eq('rol', 'Líder')
        .eq('estado_aprobacion', 'aprobado')
        .single();

      if (error || !leaderData) {
        console.error("Líder no encontrado o no aprobado. Email:", userEmail, "Error:", error);
        supabase.auth.signOut(); // fire-and-forget
        redirect("/connect/portal/login");
        return;
      }

      setLeader(leaderData);
      await loadStats(leaderData.id, userEmail);
      await loadUnreadCount(churchId, session.user.id);
      
    } catch (err) {
      console.error("Error verificando líder:", err);
      supabase.auth.signOut(); // fire-and-forget
      redirect("/connect/portal/login");
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async (churchId, userId) => {
    try {
      const { data: allMaterials } = await supabase
        .from('leader_materials')
        .select('id, title, category, created_at')
        .eq('church_id', churchId)
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
    } catch (err) {
      console.error("Error cargando no leídos:", err);
    }
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadStats = async (leaderId, leaderEmail) => {
    try {
      // Contar reportes del último mes
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: reportsCount } = await supabase
        .from('leader_cell_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('leader_id', leaderId)
        .gte('report_date', thirtyDaysAgo.toISOString().split('T')[0]);

      // Contar miembros de mi célula (por lider_id en personas)
      const { count: membersCount } = await supabase
        .from('personas')
        .select('*', { count: 'exact', head: true })
        .eq('lider_id', leaderId);

      // Contar pedidos de oración activos
      const { count: prayersCount } = await supabase
        .from('leader_prayer_requests')
        .select('*', { count: 'exact', head: true })
        .eq('leader_email', leaderEmail)
        .eq('status', 'active');

      setStats({
        recentReports: reportsCount || 0,
        cellMembers: membersCount || 0,
        prayerRequests: prayersCount || 0
      });
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    redirect("/connect/portal/login");
  };

  const menuItems = [
    {
      title: "Cargar Reporte",
      description: "Reportar asistencia, ofrendas y testimonios",
      icon: FileText,
      href: "/connect/portal/reportes",
      color: "from-blue-500 to-blue-600",
      badge: stats.recentReports > 0 ? `${stats.recentReports} este mes` : null
    },
    {
      title: "Materiales",
      description: "Accede a recursos y capacitaciones",
      icon: BookOpen,
      href: "/connect/portal/materiales",
      color: "from-purple-500 to-purple-600",
      badge: unreadMaterials > 0 ? `${unreadMaterials} nuevo${unreadMaterials > 1 ? 's' : ''}` : null,
      badgeNew: unreadMaterials > 0
    },
    {
      title: "Mis Miembros",
      description: "Lista de miembros de tu célula",
      icon: Users,
      href: "/connect/portal/miembros",
      color: "from-green-500 to-green-600",
      badge: stats.cellMembers > 0 ? `${stats.cellMembers} personas` : null
    },
    {
      title: "Pedidos de Oración",
      description: "Ver y agregar pedidos de oración",
      icon: Heart,
      href: "/connect/portal/oracion",
      color: "from-red-500 to-red-600",
      badge: stats.prayerRequests > 0 ? `${stats.prayerRequests} activos` : null
    }
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Portal de Líderes
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Hola, {leader?.nombre} {leader?.apellido}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Campanita con dropdown */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen(o => !o)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Notificaciones"
              >
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
                    {unreadMaterials > 0 && (
                      <span className="text-xs text-red-600 font-medium">{unreadMaterials} sin leer</span>
                    )}
                  </div>

                  {unreadList.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">
                      Todo al día, no hay materiales nuevos.
                    </div>
                  ) : (
                    <ul>
                      {unreadList.map(m => (
                        <li key={m.id}>
                          <button
                            onClick={() => redirect("/connect/portal/materiales")}
                            className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0"
                          >
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
                    <button
                      onClick={() => redirect("/connect/portal/materiales")}
                      className="text-xs text-purple-600 font-medium hover:text-purple-700 w-full text-center py-1"
                    >
                      Ver todos los materiales →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reportes (30 días)</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.recentReports}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Miembros de célula</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.cellMembers}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pedidos activos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.prayerRequests}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => redirect(item.href)}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 text-left group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {item.description}
              </p>
              
              {item.badge && (
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  item.badgeNew
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            ¿Necesitás ayuda?
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Si tenés dudas sobre cómo usar el portal, contactá a tu pastor o al equipo de soporte.
          </p>
          <a 
            href="/connect/counseling"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Ir a consejería
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </main>
    </div>
  );
}
