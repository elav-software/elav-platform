"use client";
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from '@connect/lib/router-compat';
import { createPageUrl } from '@connect/utils';
import { api } from '@connect/api/apiClient';
import UnderConstructionBanner from '@connect/components/UnderConstructionBanner';
import { 
  Home, 
  Radio, 
  BookOpen, 
  HandHeart, 
  Heart,
  Menu,
  X,
  User,
  LogOut,
  Shield,
  Bell
} from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@connect/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { icon: Home, label: 'Inicio', href: 'Home' },
  { icon: Radio, label: 'En Vivo', href: 'Live' },
  { icon: BookOpen, label: 'Biblia', href: 'Bible' },
  { icon: HandHeart, label: 'Oración', href: 'Prayer' },
  { icon: Heart, label: 'Dar', href: 'Give' },
];

const menuItems = [
  { label: 'Sermones', href: 'Sermons' },
  { label: 'Devocionales', href: 'Devotionals' },
  { label: 'Eventos', href: 'Events' },
  { label: 'Anuncios', href: 'Announcements' },
  { label: 'Radio', href: 'Radio' },
  { label: 'Consejería', href: 'Counseling' },
  { label: 'Mis Notas', href: 'MyNotes' },
];

const adminItems = [
  { label: 'Panel de Admin', href: 'AdminDashboard' },
  { label: 'Materiales', href: 'LeadershipMaterials' },
  { label: 'Reportes', href: 'MinistryReports' },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await api.auth.me();
      setUser(currentUser);
    } catch (e) {
      setUser(null);
    }
  };

  const handleLogout = () => {
    api.auth.logout();
  };

  const isAdmin = user?.role === 'admin';
  const isActive = (href) => currentPageName === href;

  // Hide bottom nav on certain pages
  const hideBottomNav = ['AdminDashboard', 'LeadershipMaterials', 'MinistryReports'].includes(currentPageName);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-700">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex flex-col h-full">
                {/* Menu Header */}
                <div className="p-6 bg-gradient-to-br from-red-600 to-red-700 text-white">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69878a2b6ba10a3126753b8e/6932d40b5_ChatGPTImage9feb202609_56_36pm.png" 
                    alt="CFC" 
                    className="w-20 h-auto mb-4 bg-white rounded-lg p-2"
                  />
                  <h2 className="font-semibold text-lg">CFC Isidro Casanova</h2>
                  <p className="text-white/80 text-sm">Tu lugar, Tu casa</p>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 py-4 overflow-y-auto">
                  <div className="px-4 mb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menú</p>
                  </div>
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      to={createPageUrl(item.href)}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                        isActive(item.href) 
                          ? 'bg-red-50 text-red-600 border-r-2 border-red-600' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}

                  {isAdmin && (
                    <>
                      <div className="px-4 mt-6 mb-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                          <Shield className="w-3 h-3" /> Liderazgo
                        </p>
                      </div>
                      {adminItems.map((item) => (
                        <Link
                          key={item.href}
                          to={createPageUrl(item.href)}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                            isActive(item.href) 
                              ? 'bg-red-50 text-red-600 border-r-2 border-red-600' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </>
                  )}
                </nav>

                {/* User Section */}
                <div className="border-t p-4">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.full_name || 'Usuario'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-gray-600" 
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-red-600 hover:bg-red-700"
                      onClick={() => api.auth.redirectToLogin()}
                    >
                      Iniciar Sesión
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69878a2b6ba10a3126753b8e/6932d40b5_ChatGPTImage9feb202609_56_36pm.png" 
              alt="CFC" 
              className="h-8 w-auto object-contain"
            />
          </Link>

          <Button variant="ghost" size="icon" className="text-gray-700">
            <Bell className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Under Construction Banner */}
      <UnderConstructionBanner />

      {/* Main Content */}
      <main className={`flex-1 ${!hideBottomNav ? 'pb-20' : ''}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-pb">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={createPageUrl(item.href)}
                  className="flex flex-col items-center justify-center w-full h-full relative"
                >
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute top-0 w-12 h-0.5 bg-red-600 rounded-full"
                    />
                  )}
                  <item.icon className={`w-5 h-5 ${active ? 'text-red-600' : 'text-gray-400'}`} />
                  <span className={`text-xs mt-1 ${active ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <style>{`
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}