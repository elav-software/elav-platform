import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "@crm/lib/router-compat";
import { createPageUrl } from "@crm/utils";
import { supabase } from "@crm/api/supabaseClient";
import {
  LayoutDashboard, Users, UserPlus, Church, Calendar,
  HandHeart, DollarSign, BarChart3, MessageSquare, ClipboardList,
  Menu, X, LogOut, User, Crown, ShieldCheck } from
"lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@crm/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@crm/components/ui/tooltip";
import { Button } from "@crm/components/ui/button";

const USER_ALLOWED_PAGES = ["Visitors", "Ministries", "Events", "PrayerRequests", "Communication", "Surveys"];

const navItems = [
{ name: "Panel Principal", icon: LayoutDashboard, page: "Dashboard", adminOnly: false },
{ name: "Miembros", icon: Users, page: "Members", adminOnly: false },
{ name: "Visitantes", icon: UserPlus, page: "Visitors", adminOnly: false },
{ name: "Ministerios", icon: Church, page: "Ministries", adminOnly: false },
{ name: "Eventos", icon: Calendar, page: "Events", adminOnly: false },
{ name: "Peticiones de Oración", icon: HandHeart, page: "PrayerRequests", adminOnly: false },
{ name: "Donaciones", icon: DollarSign, page: "Donations", adminOnly: false },
{ name: "Métricas", icon: BarChart3, page: "Demographics", adminOnly: false },
{ name: "Comunicación", icon: MessageSquare, page: "Communication", adminOnly: false },
{ name: "Líderes y Células", icon: Crown, page: "Leaders", adminOnly: false },
{ name: "Encuestas", icon: ClipboardList, page: "Surveys", adminOnly: false },
{ name: "Usuarios", icon: ShieldCheck, page: "UserManagement", adminOnly: true },
];


export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      
      // Verificar si el usuario está en church_users
      const { data: churchUser } = await supabase
        .from('church_users')
        .select('role, is_active')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();
      
      const u = {
        id: session.user.id,
        email: session.user.email,
        full_name:
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split("@")[0] || "",
        role: churchUser?.role ?? "user",
      };
      setUser(u);
      if (u.role !== "admin") {
        setAccessDenied(true);
      }
    }).catch(() => {});
  }, [currentPageName, location.pathname]);

  const handleLogout = async () => {
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

  const visibleNavItems = navItems;

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
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69aee310d84123cf531d4bcb/959fffeb5_IMG_0496.jpeg" alt="CFC Logo" className="w-8 h-8 rounded-full object-cover" />
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
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69aee310d84123cf531d4bcb/959fffeb5_IMG_0496.jpeg" alt="CFC Logo" className="w-10 h-10 rounded-full object-cover shadow-lg" />
                <div>
                  <h1 className="font-bold text-lg leading-tight">CFC CASA</h1>
                  <p className="text-xs text-slate-400">Sistema de Gestión</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="bg-slate-700 text-slate-50 px-3 py-4 flex-1 overflow-y-auto space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = currentPageName === item.page;
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
                  {item.name}
                </Link>
              );
            })}
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
                    user?.role === "admin"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-slate-500/30 text-slate-300"
                  }`}>
                    {user?.role === "admin" ? "Admin" : "User"}
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