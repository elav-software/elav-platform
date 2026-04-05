import React from 'react';
import { Play, Radio, Calendar } from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Link } from '@connect/lib/router-compat';
import { createPageUrl } from '@connect/utils';
import { motion } from 'framer-motion';

export default function LiveBanner({ isLive, liveService, nextService }) {
  if (isLive && liveService) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-500 to-red-700 p-6 text-white shadow-xl">

        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              EN VIVO AHORA
            </span>
          </div>
          
          <h3 className="text-xl font-bold mb-2">{liveService.title}</h3>
          <p className="text-white/80 text-sm mb-4">{liveService.description || 'Únete a nuestro servicio en vivo'}</p>
          
          <Link to={createPageUrl('Live')}>
            <Button className="bg-white text-red-600 hover:bg-white/90 font-semibold">
              <Play className="w-4 h-4 mr-2 fill-current" />
              Ver Ahora
            </Button>
          </Link>
        </div>
      </motion.div>);

  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }} className="bg-zinc-500 text-white p-6 rounded-2xl relative overflow-hidden from-slate-800 to-slate-900 shadow-xl">


      <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative z-10">
        {nextService ?
        <>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm font-medium">Próximo Servicio</span>
            </div>
            
            <h3 className="text-xl font-bold mb-2">{nextService.title}</h3>
            <p className="text-white/70 text-sm mb-4">
              {new Date(nextService.date).toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit'
            })}
            </p>
            
            <Link to={createPageUrl('Sermons')}>
              <Button variant="outline" className="bg-background text-slate-800 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-9 border-white/30 hover:bg-white/10">
                <Play className="w-4 h-4 mr-2" />
                Ver Último Sermón
              </Button>
            </Link>
          </> :

        <>
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm font-medium">Transmisiones</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Bienvenido a CFC</h3>
            <p className="text-white/70 text-sm mb-4">Explora nuestros sermones y recursos</p>
            <Link to={createPageUrl('Sermons')}>
              <Button variant="outline" className="bg-background text-zinc-950 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-9 border-white/30 hover:bg-white/10">
                <Play className="w-4 h-4 mr-2" />
                Ver Sermones
              </Button>
            </Link>
          </>
        }
      </div>
    </motion.div>);

}