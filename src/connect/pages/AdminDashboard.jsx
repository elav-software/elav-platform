"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@connect/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@connect/lib/router-compat';
import { createPageUrl } from '@connect/utils';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  HandHeart, 
  Heart,
  Bell,
  FileText,
  ClipboardList,
  Plus,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Video,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@connect/components/ui/card';
import { Button } from '@connect/components/ui/button';
import { Badge } from '@connect/components/ui/badge';
import { Skeleton } from '@connect/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@connect/components/ui/tabs';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (e) {
      setUser(null);
    }
  };

  const { data: prayerRequests = [], isLoading: loadingPrayer } = useQuery({
    queryKey: ['adminPrayerRequests'],
    queryFn: () => base44.entities.PrayerRequest.list('-created_date', 50),
    enabled: user?.role === 'admin',
  });

  const { data: counselingRequests = [], isLoading: loadingCounseling } = useQuery({
    queryKey: ['adminCounselingRequests'],
    queryFn: () => base44.entities.CounselingRequest.list('-created_date', 50),
    enabled: user?.role === 'admin',
  });

  const { data: events = [] } = useQuery({
    queryKey: ['adminEvents'],
    queryFn: () => base44.entities.Event.list('-date', 20),
    enabled: user?.role === 'admin',
  });

  const { data: donations = [] } = useQuery({
    queryKey: ['adminDonations'],
    queryFn: () => base44.entities.Donation.list('-created_date', 100),
    enabled: user?.role === 'admin',
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['adminRegistrations'],
    queryFn: () => base44.entities.EventRegistration.list('-created_date', 100),
    enabled: user?.role === 'admin',
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <LayoutDashboard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Acceso Restringido</h2>
          <p className="text-gray-500">Esta área es solo para administradores</p>
          <Link to={createPageUrl('Home')}>
            <Button className="mt-4 bg-red-600 hover:bg-red-700">
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const pendingCounseling = counselingRequests.filter(c => c.status === 'pending').length;
  const confidentialPrayers = prayerRequests.filter(p => p.is_confidential && p.status === 'active').length;
  const totalDonations = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const pendingDonations = donations.filter(d => d.payment_status === 'pending').length;

  const quickActions = [
    { label: 'Nuevo Sermón', icon: Video, href: 'AdminSermons', color: 'bg-red-50 text-red-600' },
    { label: 'Nuevo Devocional', icon: BookOpen, href: 'AdminDevotionals', color: 'bg-amber-50 text-amber-600' },
    { label: 'Nuevo Evento', icon: Calendar, href: 'AdminEvents', color: 'bg-blue-50 text-blue-600' },
    { label: 'Nuevo Anuncio', icon: Bell, href: 'AdminAnnouncements', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-4 py-6 text-white">
        <h1 className="text-xl font-bold mb-1">Panel de Administración</h1>
        <p className="text-white/70 text-sm">Bienvenido, {user.full_name?.split(' ')[0]}</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            title="Consejería" 
            value={pendingCounseling} 
            label="pendientes"
            icon={Heart}
            color="text-purple-600"
            alert={pendingCounseling > 0}
          />
          <StatCard 
            title="Oración" 
            value={confidentialPrayers} 
            label="confidenciales"
            icon={HandHeart}
            color="text-red-600"
            alert={confidentialPrayers > 0}
          />
          <StatCard 
            title="Donaciones" 
            value={`$${(totalDonations/1000).toFixed(0)}k`} 
            label="este mes"
            icon={Heart}
            color="text-green-600"
          />
          <StatCard 
            title="Registros" 
            value={registrations.length} 
            label="eventos"
            icon={Users}
            color="text-blue-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} to={createPageUrl(action.href)}>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 p-4 rounded-xl bg-white border shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-900 text-sm">{action.label}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="counseling" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="counseling" className="relative">
              Consejería
              {pendingCounseling > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingCounseling}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="prayer" className="relative">
              Oración
              {confidentialPrayers > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {confidentialPrayers}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="donations">Donaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="counseling" className="space-y-3 mt-4">
            {loadingCounseling ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : counselingRequests.filter(c => c.status === 'pending').length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay solicitudes pendientes</p>
            ) : (
              counselingRequests.filter(c => c.status === 'pending').slice(0, 5).map((request) => (
                <Card key={request.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{request.requester_name}</h3>
                        <p className="text-sm text-gray-500">{request.requester_email}</p>
                        <Badge className="mt-2 bg-amber-100 text-amber-700">
                          {request.topic}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(new Date(request.created_date), 'd MMM', { locale: es })}
                      </span>
                    </div>
                    {request.brief_description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{request.brief_description}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="prayer" className="space-y-3 mt-4">
            {loadingPrayer ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : prayerRequests.filter(p => p.is_confidential && p.status === 'active').length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay pedidos confidenciales</p>
            ) : (
              prayerRequests.filter(p => p.is_confidential && p.status === 'active').slice(0, 5).map((request) => (
                <Card key={request.id} className="shadow-sm border-red-100">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{request.requester_name || 'Anónimo'}</h3>
                        <Badge className="mt-1 bg-red-100 text-red-700">Confidencial</Badge>
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(new Date(request.created_date), 'd MMM', { locale: es })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{request.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="donations" className="space-y-3 mt-4">
            {donations.slice(0, 5).map((donation) => (
              <Card key={donation.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{donation.donor_name || 'Anónimo'}</h3>
                      <p className="text-sm text-gray-500">{donation.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${donation.amount?.toLocaleString()}</p>
                      <Badge className={donation.payment_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {donation.payment_status === 'completed' ? 'Completado' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Admin Links */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Gestión de Contenido
          </h2>
          <div className="space-y-2">
            <AdminLink label="Gestionar Servicios" href="AdminServices" icon={Calendar} />
            <AdminLink label="Gestionar Sermones" href="AdminSermons" icon={Video} />
            <AdminLink label="Gestionar Devocionales" href="AdminDevotionals" icon={BookOpen} />
            <AdminLink label="Gestionar Eventos" href="AdminEvents" icon={Calendar} />
            <AdminLink label="Gestionar Anuncios" href="AdminAnnouncements" icon={Bell} />
          </div>
        </div>

        {/* Leadership Links */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Área de Liderazgo
          </h2>
          <div className="space-y-2">
            <AdminLink label="Materiales de Estudio" href="LeadershipMaterials" icon={FileText} />
            <AdminLink label="Reportes de Ministerios" href="MinistryReports" icon={ClipboardList} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, label, icon: Icon, color, alert }) {
  return (
    <Card className={`relative overflow-hidden ${alert ? 'border-red-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
          <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-')}/10`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
        {alert && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </CardContent>
    </Card>
  );
}

function AdminLink({ label, href, icon: Icon }) {
  return (
    <Link to={createPageUrl(href)}>
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-900">{label}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </Link>
  );
}