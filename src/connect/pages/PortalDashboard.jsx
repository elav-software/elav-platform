"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "@connect/lib/router-compat";
import { supabase } from "@connect/api/supabaseClient";
import { getCurrentChurchId } from "@connect/api/apiClient";
import { 
  FileText, 
  BookOpen, 
  Users, 
  Heart, 
  LogOut,
  BarChart3,
  ChevronRight 
} from "lucide-react";

export default function PortalDashboard() {
  const [leader, setLeader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    recentReports: 0,
    cellMembers: 0,
    prayerRequests: 0
  });
  const navigate = useNavigate();

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
      
      // Verificar líder aprobado
      const { data: leaderData, error } = await supabase
        .from('personas')
        .select('id, nombre, apellido, email, celula_id')
        .eq('church_id', churchId)
        .eq('email', session.user.email)
        .eq('es_lider', true)
        .eq('estado_aprobacion', 'aprobado')
        .single();

      if (error || !leaderData) {
        console.error("Líder no encontrado o no aprobado:", error);
        navigate("/connect/portal/login");
        return;
      }

      setLeader(leaderData);
      await loadStats(leaderData.id, session.user.email);
      
    } catch (err) {
      console.error("Error verificando líder:", err);
      navigate("/connect/portal/login");
    } finally {
      setLoading(false);
    }
  };

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

      // Contar miembros de mi célula
      const { count: membersCount } = await supabase
        .from('personas')
        .select('*', { count: 'exact', head: true })
        .eq('celula_id', (await supabase
          .from('personas')
          .select('celula_id')
          .eq('id', leaderId)
          .single()
        ).data?.celula_id || '');

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
    navigate("/connect/portal/login");
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
      color: "from-purple-500 to-purple-600"
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
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
              onClick={() => navigate(item.href)}
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
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
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
