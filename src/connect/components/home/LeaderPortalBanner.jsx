import React from 'react';
import { UserCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LeaderPortalBanner() {
  return (
    <motion.a
      href="/connect/portal/login"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="block"
    >
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <UserCheck className="w-7 h-7 text-white" />
            </div>
            <div className="text-white">
              <h3 className="font-bold text-lg mb-1">Portal de Líderes</h3>
              <p className="text-sm text-purple-100 opacity-90">
                Reportes, materiales y gestión de células
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-white font-medium">
            <span className="text-sm">Ingresar</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </motion.a>
  );
}
