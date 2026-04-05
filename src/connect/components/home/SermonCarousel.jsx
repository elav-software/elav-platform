import React from 'react';
import { Link } from '@connect/lib/router-compat';
import { createPageUrl } from '@connect/utils';
import { Play, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SermonCarousel({ sermons = [] }) {
  if (sermons.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Últimos Sermones</h2>
        <Link 
          to={createPageUrl('Sermons')} 
          className="text-red-600 text-sm font-medium flex items-center gap-1 hover:text-red-700"
        >
          Ver todos <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {sermons.map((sermon, index) => (
          <motion.div
            key={sermon.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-64"
          >
            <Link to={createPageUrl(`Sermons?id=${sermon.id}`)}>
              <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-200 group">
                {sermon.thumbnail_url ? (
                  <img 
                    src={sermon.thumbnail_url} 
                    alt={sermon.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                    <Play className="w-10 h-10 text-white/80" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-5 h-5 text-red-600 fill-current ml-1" />
                  </div>
                </div>
                {sermon.duration && (
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                    {sermon.duration}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">{sermon.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {sermon.speaker} • {sermon.date && format(new Date(sermon.date), 'd MMM yyyy', { locale: es })}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}