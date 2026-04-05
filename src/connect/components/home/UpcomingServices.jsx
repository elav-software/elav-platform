import React from 'react';
import { Clock, MapPin, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

const serviceTypeLabels = {
  sunday_service: 'Servicio Dominical',
  wednesday_service: 'Servicio de Miércoles',
  youth: 'Jóvenes',
  prayer_meeting: 'Reunión de Oración',
  special_event: 'Evento Especial'
};

const serviceTypeColors = {
  sunday_service: 'bg-red-50 text-red-600 border-red-100',
  wednesday_service: 'bg-blue-50 text-blue-600 border-blue-100',
  youth: 'bg-purple-50 text-purple-600 border-purple-100',
  prayer_meeting: 'bg-amber-50 text-amber-600 border-amber-100',
  special_event: 'bg-green-50 text-green-600 border-green-100'
};

export default function UpcomingServices({ services = [] }) {
  if (services.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl p-6 text-center">
        <p className="text-gray-500">No hay servicios programados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Próximos Servicios</h2>
      
      <div className="space-y-3">
        {services.slice(0, 3).map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${serviceTypeColors[service.type] || 'bg-gray-50 text-gray-600'}`}>
                  {serviceTypeLabels[service.type] || service.type}
                </span>
                <h3 className="font-semibold text-gray-900 mt-2">{service.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(service.date), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}