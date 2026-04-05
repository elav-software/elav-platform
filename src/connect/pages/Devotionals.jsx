"use client";
import React, { useState } from 'react';
import { base44 } from '@connect/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  BookOpen, 
  Calendar, 
  ChevronLeft,
  Share2,
  Heart
} from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Skeleton } from '@connect/components/ui/skeleton';
import { ScrollArea } from '@connect/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

export default function Devotionals() {
  const [selectedDevotional, setSelectedDevotional] = useState(null);

  const { data: devotionals = [], isLoading } = useQuery({
    queryKey: ['devotionals'],
    queryFn: () => base44.entities.Devotional.filter({ is_published: true }, '-publish_date'),
  });

  const todayDevotional = devotionals.find(d => 
    d.publish_date && isToday(new Date(d.publish_date))
  );

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    return format(date, "d 'de' MMMM", { locale: es });
  };

  const handleShare = async (devotional) => {
    if (navigator.share) {
      await navigator.share({
        title: devotional.title,
        text: `${devotional.scripture_text}\n\n${devotional.scripture}\n\n${devotional.content.substring(0, 200)}...`,
      });
    }
  };

  if (selectedDevotional) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedDevotional(null)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleShare(selectedDevotional)}
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-60px)]">
          <div className="p-6 max-w-lg mx-auto">
            {selectedDevotional.image_url && (
              <img 
                src={selectedDevotional.image_url} 
                alt={selectedDevotional.title}
                className="w-full h-48 object-cover rounded-2xl mb-6"
              />
            )}

            <span className="text-sm text-red-600 font-medium">
              {formatDate(selectedDevotional.publish_date)}
            </span>
            
            <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-4">
              {selectedDevotional.title}
            </h1>

            {/* Scripture */}
            <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-100">
              <p className="text-gray-800 italic leading-relaxed">
                "{selectedDevotional.scripture_text}"
              </p>
              <p className="text-amber-700 font-semibold text-sm mt-3">
                — {selectedDevotional.scripture}
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown>{selectedDevotional.content}</ReactMarkdown>
            </div>

            {selectedDevotional.author && (
              <p className="text-sm text-gray-500 mt-8 pt-4 border-t">
                Por {selectedDevotional.author}
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-8 text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Devocionales</h1>
            <p className="text-white/80 text-sm">Alimento diario para tu alma</p>
          </div>
        </div>
      </div>

      {/* Today's Devotional */}
      {todayDevotional && (
        <div className="p-4 -mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedDevotional(todayDevotional)}
            className="bg-white rounded-2xl overflow-hidden shadow-lg cursor-pointer"
          >
            {todayDevotional.image_url && (
              <img 
                src={todayDevotional.image_url} 
                alt={todayDevotional.title}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4">
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                DEVOCIONAL DE HOY
              </span>
              <h2 className="text-lg font-bold text-gray-900 mt-2">{todayDevotional.title}</h2>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {todayDevotional.scripture_text}
              </p>
              <p className="text-xs text-amber-600 font-medium mt-2">
                {todayDevotional.scripture}
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* List */}
      <div className="p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Devocionales Anteriores
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : devotionals.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay devocionales disponibles</p>
          </div>
        ) : (
          <AnimatePresence>
            {devotionals.filter(d => d.id !== todayDevotional?.id).map((devotional, index) => (
              <motion.div
                key={devotional.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedDevotional(devotional)}
                className="flex gap-4 bg-white rounded-xl p-4 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
              >
                {devotional.image_url ? (
                  <img 
                    src={devotional.image_url} 
                    alt={devotional.title}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-amber-50 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-amber-300" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-500">
                    {formatDate(devotional.publish_date)}
                  </span>
                  <h3 className="font-semibold text-gray-900 line-clamp-1 mt-1">
                    {devotional.title}
                  </h3>
                  <p className="text-sm text-amber-600 line-clamp-1">
                    {devotional.scripture}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}