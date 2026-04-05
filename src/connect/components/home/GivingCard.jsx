import React from 'react';
import { Link } from '@connect/lib/router-compat';
import { createPageUrl } from '@connect/utils';
import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { motion } from 'framer-motion';

export default function GivingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }} className="bg-slate-200 p-6 rounded-2xl from-red-50 to-pink-50 border border-red-100">


      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-100 rounded-xl">
          <Heart className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">Dar es Adorar</h3>
          <p className="text-sm text-gray-600 mb-4">
            Tu generosidad hace posible la obra de Dios en nuestra comunidad.
          </p>
          <Link to={createPageUrl('Give')}>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              Ofrendar Ahora
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>);

}