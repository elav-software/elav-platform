import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "@crm/lib/router-compat";
import { createPageUrl } from "@crm/utils";
import { supabase } from "@crm/api/supabaseClient";
import { clearChurchIdCache, getMyChurchId, getMyRole, setSuperadminSelectedChurch, getSuperadminSelectedChurch } from "@crm/api/apiClient";
import {
  LayoutDashboard, Users, UserPlus, Church, Calendar,
  HandHeart, DollarSign, BarChart3, MessageSquare, ClipboardList,
  Menu, X, LogOut, User, Crown, UserCheck, FolderOpen } from
"lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@crm/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@crm/components/ui/tooltip";
import { Button } from "@crm/components/ui/button";


const navItems = [
{ name: "Panel Principal", icon: LayoutDashboard, page: "Dashboard", adminOnly: false },
{ name: "Miembros", icon: Users, page: "Members", adminOnly: false },
{ name: "Visitantes", icon: UserPlus, page: "Visitors", adminOnly: false },
{ name: "Ministerios", icon: Church, page: "Ministries", adminOnly: false },
{ name: "Eventos", icon: Calendar, page: "Events", adminOnly: false },
{ name: "Peticiones de Oración", icon: HandHeart, page: "PrayerRequests", adminOnly: false },
{ name: "Tesorería", icon: DollarSign, page: "Donations", adminOnly: false },
{ name: "Métricas", icon: BarChart3, page: "Demographics", adminOnly: false },
{ name: "Comunicación", icon: MessageSquare, page: "Communication", adminOnly: false },
{ name: "Líderes y Células", icon: Crown, page: "Leaders", adminOnly: false },
{ name: "Reportes de Células", icon: ClipboardList, page: "CellSubmissions", adminOnly: false },
{ name: "Materiales Líderes", icon: FolderOpen, page: "Materials", adminOnly: true },

];


export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [pendingLeadersCount, setPendingLeadersCount] = useState(0);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [churches, setChurches] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 horas

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;

      // Verificar expiración de 4hs por código
      const loginAt = new Date(session.user.last_sign_in_at).getTime();
      if (Date.now() - loginAt > SESSION_MAX_AGE_MS) {
        await supabase.auth.signOut();
        window.location.href = '/crm/login';
        return;
      }
      
      // Verificar si el usuario está en church_users
      // Usamos maybeSingle y priorizamos superadmin si hay múltiples filas
      const { data: churchUsers } = await supabase
        .from('church_users')
        .select('role, is_active')
        .eq('user_id', session.user.id)
        .eq('is_active', true);
      
      const roleOrder = { superadmin: 0, admin: 1, user: 2 };
      const bestChurchUser = (churchUsers || []).sort(
        (a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9)
      )[0] ?? null;

      // JWT user_metadata tiene prioridad (no depende de RLS)
      const metaRole = session.user.user_metadata?.role;
      const resolvedRole = metaRole === 'superadmin'
        ? 'superadmin'
        : (bestChurchUser?.role ?? 'user');
      
      const u = {
        id: session.user.id,
        email: session.user.email,
        full_name:
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split("@")[0] || "",
        role: resolvedRole,
      };
      setUser(u);

      if (u.role === 'superadmin') {
        // Cargar todas las iglesias disponibles
        const { data: allChurches } = await supabase
          .from('churches')
          .select('id, name')
          .eq('is_active', true)
          .order('name');
        setChurches(allChurches || []);
        // Restaurar iglesia seleccionada de sesión anterior
        const saved = getSuperadminSelectedChurch();
        if (saved && allChurches?.find(c => c.id === saved)) {
          setSelectedChurch(saved);
        } else if (allChurches?.length) {
          const first = allChurches[0].id;
          setSuperadminSelectedChurch(first);
          setSelectedChurch(first);
        }
        loadPendingLeaders();
        loadPendingReports();
      } else if (u.role !== 'admin') {
        setAccessDenied(true);
      } else {
        loadPendingLeaders();
        loadPendingReports();
      }
    }).catch(() => {});
  }, []);  // run once on mount — session doesn’t change while navigating
  
  const loadPendingLeaders = async () => {
    try {
      const churchId = await getMyChurchId();
      const { count } = await supabase
        .from('personas')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .eq('rol', 'Líder')
        .eq('estado_aprobacion', 'pendiente');
      
      setPendingLeadersCount(count || 0);
    } catch (err) {
      console.error("Error cargando líderes pendientes:", err);
    }
  };

  const loadPendingReports = async () => {
    try {
      const churchId = await getMyChurchId();
      const { count } = await supabase
        .from('leader_cell_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .eq('status', 'submitted');
      setPendingReportsCount(count || 0);
    } catch (err) {
      console.error("Error cargando reportes pendientes:", err);
    }
  };

  const handleChurchChange = (churchId) => {
    setSuperadminSelectedChurch(churchId);
    setSelectedChurch(churchId);
    // Recargar la página para que todos los componentes tomen el nuevo church_id
    window.location.reload();
  };

  const handleLogout = async () => {
    clearChurchIdCache();
    await supabase.auth.signOut();
    window.location.href = "/crm/login";
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="text-6xl">🔒</div>
        <div>
          <h1 className="text-2xl font-bold text-white">Acceso no autorizado</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Tu cuenta no tiene permisos para acceder al CRM.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  // Only show adminOnly items to admins/superadmin
  const visibleNavItems = (user?.role === 'admin' || user?.role === 'superadmin')
    ? navItems
    : navItems.filter(item => !item.adminOnly);

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --church-navy: #1e293b;
          --church-gold: #d4a843;
          --church-gold-light: #f5e6c4;
        }
      `}</style>

      {/* Mobile Header */}
      <div className="bg-red-600 px-4 opacity-100 lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-slate-200 h-16 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2">
          <Menu className="text-slate-50 lucide lucide-menu w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="CFC Logo" className="w-8 h-8 rounded-full object-cover" />
          <span className="text-slate-50 font-bold">CFC CASA CRM</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen &&
      <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)} />
      }

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-[var(--church-navy)] text-white
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="bg-slate-800 text-slate-50 p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="CFC Logo" className="w-10 h-10 rounded-full object-cover shadow-lg" />
                <div>
                  <h1 className="font-bold text-lg leading-tight">CFC CASA</h1>
                  <p className="text-xs text-slate-400">Sistema de Gestión</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de iglesia para superadmin */}
            {user?.role === 'superadmin' && churches.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-slate-400 mb-1.5">Viendo iglesia:</p>
                <select
                  value={selectedChurch || ''}
                  onChange={e => handleChurchChange(e.target.value)}
                  className="w-full text-xs bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
                >
                  {churches.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="bg-slate-700 text-slate-50 px-3 py-4 flex-1 overflow-y-auto space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = currentPageName === item.page;
              const badge = item.page === "CellSubmissions" && pendingReportsCount > 0 ? pendingReportsCount : null;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive ?
                  "bg-[var(--church-gold)] text-[var(--church-navy)] shadow-lg shadow-amber-900/20" :
                  "text-slate-300 hover:bg-white/10 hover:text-white"}
                  `}>
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {badge && (
                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
            
            {/* Aprobación de Líderes (con badge) */}
            {(user?.role === "admin" || user?.role === 'superadmin') && (
              <Link
                to="/crm/leaders/approvals"
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${currentPageName === "LeaderApprovals" ?
                "bg-[var(--church-gold)] text-[var(--church-navy)] shadow-lg shadow-amber-900/20" :
                "text-slate-300 hover:bg-white/10 hover:text-white"}
                `}>
                <UserCheck className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">Aprobación de Líderes</span>
                {pendingLeadersCount > 0 && (
                  <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                    {pendingLeadersCount}
                  </span>
                )}
              </Link>
            )}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{user?.full_name || "Usuario"}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${
                    user?.role === "superadmin"
                      ? "bg-purple-500/30 text-purple-300"
                      : user?.role === "admin"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-slate-500/30 text-slate-300"
                  }`}>
                    {user?.role === "superadmin" ? "Superadmin" : user?.role === "admin" ? "Admin" : "User"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">{user?.email || ""}</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                          <LogOut className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de que deseas cerrar sesión? Deberás volver a ingresar tus credenciales.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">
                            Cerrar Sesión
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TooltipTrigger>
                  <TooltipContent side="top">Cerrar sesión</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">
        <div className="bg-red-50 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>);

}