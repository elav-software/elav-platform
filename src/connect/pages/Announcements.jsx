"use client";
import React, { useState } from 'react';
import { api } from '@connect/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  ChevronLeft,
  Calendar
} from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Skeleton } from '@connect/components/ui/skeleton';
import { Badge } from '@connect/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { es } from 'date-fns/locale';

const priorityConfig = {
  normal: { icon: Info, color: 'bg-blue-100 text-blue-700', label: 'Información' },
  important: { icon: Bell, color: 'bg-amber-100 text-amber-700', label: 'Importante' },
  urgent: { icon: AlertTriangle, color: 'bg-red-100 text-red-700', label: 'Urgente' },
};

export default function Announcements() {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.entities.Announcement.filter({ is_published: true }, '-publish_date'),
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    if (isThisWeek(date)) return format(date, 'EEEE', { locale: es });
    return format(date, "d 'de' MMMM", { locale: es });
  };

  if (selectedAnnouncement) {
    const config = priorityConfig[selectedAnnouncement.priority] || priorityConfig.normal;
    const Icon = config.icon;

    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSelectedAnnouncement(null)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {selectedAnnouncement.image_url && (
            <img 
              src={selectedAnnouncement.image_url} 
              alt={selectedAnnouncement.title}
              className="w-full h-48 object-cover rounded-2xl mb-6"
            />
          )}

          <Badge className={config.color}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>

          <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
            {selectedAnnouncement.title}
          </h1>

          <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(selectedAnnouncement.publish_date)}
          </p>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {selectedAnnouncement.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-8 text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Anuncios</h1>
            <p className="text-white/80 text-sm">Noticias e información importante</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay anuncios disponibles</p>
          </div>
        ) : (
          <AnimatePresence>
            {announcements.map((announcement, index) => {
              const config = priorityConfig[announcement.priority] || priorityConfig.normal;
              const Icon = config.icon;

              return (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedAnnouncement(announcement)}
                  className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${
                    announcement.priority === 'urgent' ? 'border-red-200 bg-red-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${config.color.replace('text-', 'bg-').split(' ')[0]}/20`}>
                      <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">
                          {announcement.title}
                        </h3>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {formatDate(announcement.publish_date)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {announcement.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}