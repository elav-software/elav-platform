import React from 'react';
import { base44 } from '@connect/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Radio, Play, Calendar, Clock, Users } from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Skeleton } from '@connect/components/ui/skeleton';
import { Link } from '@connect/lib/router-compat';
import { createPageUrl } from '@connect/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function Live() {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list('-date', 10),
  });

  const { data: sermons = [] } = useQuery({
    queryKey: ['sermons'],
    queryFn: () => base44.entities.Sermon.list('-date', 1),
  });

  const liveService = services.find(s => s.is_live);
  const upcomingServices = services.filter(s => new Date(s.date) > new Date() && !s.is_live);
  const latestSermon = sermons[0];

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
    }
    return url;
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-600" />
          <h1 className="text-xl font-bold text-gray-900">En Vivo</h1>
        </div>

        {/* Live Stream */}
        {liveService ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-xl">
              {liveService.stream_url ? (
                <iframe
                  src={getYouTubeEmbedUrl(liveService.stream_url)}
                  title={liveService.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600 to-red-700">
                  <div className="text-center text-white">
                    <Radio className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                    <p className="font-semibold">Transmisión en curso</p>
                    <p className="text-sm text-white/80 mt-1">El video aparecerá pronto</p>
                  </div>
                </div>
              )}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                EN VIVO
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h2 className="font-bold text-lg text-gray-900">{liveService.title}</h2>
              {liveService.description && (
                <p className="text-gray-600 text-sm mt-2">{liveService.description}</p>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-center text-white"
          >
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Radio className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">No hay transmisión en vivo</h2>
            <p className="text-white/70 text-sm mb-6">
              Te invitamos a ver nuestro último sermón o explorar los próximos servicios
            </p>
            
            {latestSermon && (
              <Link to={createPageUrl(`Sermons?id=${latestSermon.id}`)}>
                <Button className="bg-white text-slate-900 hover:bg-white/90">
                  <Play className="w-4 h-4 mr-2" />
                  Ver Último Sermón
                </Button>
              </Link>
            )}
          </motion.div>
        )}

        {/* Upcoming Services */}
        {upcomingServices.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              Próximas Transmisiones
            </h2>
            
            <div className="space-y-3">
              {upcomingServices.slice(0, 3).map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 border shadow-sm"
                >
                  <h3 className="font-medium text-gray-900">{service.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(service.date), "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(service.date), 'HH:mm', { locale: es })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Watch Previous */}
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-3">¿Te perdiste algún servicio?</p>
          <Link to={createPageUrl('Sermons')}>
            <Button variant="outline" className="w-full">
              Ver Sermones Anteriores
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}