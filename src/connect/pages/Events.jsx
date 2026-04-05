"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@connect/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ChevronLeft,
  Check,
  Plus,
  Minus
} from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Input } from '@connect/components/ui/input';
import { Label } from '@connect/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@connect/components/ui/dialog';
import { Skeleton } from '@connect/components/ui/skeleton';
import { Badge } from '@connect/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const categoryColors = {
  worship: 'bg-purple-100 text-purple-700',
  youth: 'bg-blue-100 text-blue-700',
  women: 'bg-pink-100 text-pink-700',
  men: 'bg-indigo-100 text-indigo-700',
  children: 'bg-green-100 text-green-700',
  community: 'bg-amber-100 text-amber-700',
  special: 'bg-red-100 text-red-700',
};

const categoryLabels = {
  worship: 'Adoración',
  youth: 'Jóvenes',
  women: 'Mujeres',
  men: 'Hombres',
  children: 'Niños',
  community: 'Comunidad',
  special: 'Especial',
};

export default function Events() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    attendee_name: '',
    attendee_email: '',
    attendee_phone: '',
    guests: 0,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData({
        attendee_name: currentUser.full_name || '',
        attendee_email: currentUser.email || '',
        attendee_phone: '',
        guests: 0,
      });
    } catch (e) {
      setUser(null);
    }
  };

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.filter({ is_published: true }, 'date'),
  });

  const registerMutation = useMutation({
    mutationFn: (data) => base44.entities.EventRegistration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowRegister(false);
      toast.success('¡Registro exitoso!');
    },
  });

  const upcomingEvents = events.filter(e => 
    isAfter(new Date(e.date), startOfDay(new Date()))
  );

  const pastEvents = events.filter(e => 
    isBefore(new Date(e.date), startOfDay(new Date()))
  );

  const handleRegister = (e) => {
    e.preventDefault();
    if (!formData.attendee_name || !formData.attendee_email) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    registerMutation.mutate({
      event_id: selectedEvent.id,
      ...formData,
    });
  };

  if (selectedEvent) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header Image */}
        <div className="relative h-56">
          {selectedEvent.image_url ? (
            <img 
              src={selectedEvent.image_url} 
              alt={selectedEvent.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 bg-black/30 text-white hover:bg-black/50"
            onClick={() => setSelectedEvent(null)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {selectedEvent.category && (
            <Badge className={`absolute top-4 right-4 ${categoryColors[selectedEvent.category]}`}>
              {categoryLabels[selectedEvent.category]}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4 -mt-8 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedEvent.title}</h1>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-5 h-5 text-red-500" />
                <span>{format(new Date(selectedEvent.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Clock className="w-5 h-5 text-red-500" />
                <span>{format(new Date(selectedEvent.date), 'HH:mm', { locale: es })} hs</span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-5 h-5 text-red-500" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
              {selectedEvent.max_attendees && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Users className="w-5 h-5 text-red-500" />
                  <span>
                    {selectedEvent.registration_count || 0} / {selectedEvent.max_attendees} registrados
                  </span>
                </div>
              )}
            </div>

            {selectedEvent.description && (
              <p className="text-gray-700 leading-relaxed mb-6">{selectedEvent.description}</p>
            )}

            {selectedEvent.requires_registration && (
              <Button 
                onClick={() => setShowRegister(true)}
                className="w-full bg-red-600 hover:bg-red-700 h-12"
                disabled={selectedEvent.max_attendees && selectedEvent.registration_count >= selectedEvent.max_attendees}
              >
                {selectedEvent.max_attendees && selectedEvent.registration_count >= selectedEvent.max_attendees
                  ? 'Cupos agotados'
                  : 'Registrarse'}
              </Button>
            )}
          </div>
        </div>

        {/* Registration Dialog */}
        <Dialog open={showRegister} onOpenChange={setShowRegister}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrarse en {selectedEvent.title}</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  value={formData.attendee_name}
                  onChange={(e) => setFormData({ ...formData, attendee_name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.attendee_email}
                  onChange={(e) => setFormData({ ...formData, attendee_email: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.attendee_phone}
                  onChange={(e) => setFormData({ ...formData, attendee_phone: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Acompañantes</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setFormData({ ...formData, guests: Math.max(0, formData.guests - 1) })}
                    disabled={formData.guests <= 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-semibold w-8 text-center">{formData.guests}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setFormData({ ...formData, guests: formData.guests + 1 })}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowRegister(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-red-600 hover:bg-red-700"
                  disabled={registerMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Registro
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 px-4 py-8 text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Eventos</h1>
            <p className="text-white/80 text-sm">Actividades y encuentros de la iglesia</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : upcomingEvents.length === 0 && pastEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay eventos programados</p>
          </div>
        ) : (
          <>
            {upcomingEvents.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Próximos Eventos
                </h2>
                
                <AnimatePresence>
                  {upcomingEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedEvent(event)}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                    >
                      {event.image_url && (
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {event.category && (
                              <Badge className={`mb-2 ${categoryColors[event.category]}`}>
                                {categoryLabels[event.category]}
                              </Badge>
                            )}
                            <h3 className="font-bold text-gray-900">{event.title}</h3>
                          </div>
                          <div className="text-center bg-red-50 rounded-lg p-2 ml-4">
                            <span className="text-2xl font-bold text-red-600 block">
                              {format(new Date(event.date), 'd')}
                            </span>
                            <span className="text-xs text-red-600 uppercase">
                              {format(new Date(event.date), 'MMM', { locale: es })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(event.date), 'HH:mm')}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {pastEvents.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Eventos Pasados
                </h2>
                
                {pastEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="bg-gray-100 rounded-xl p-4 opacity-75"
                  >
                    <h3 className="font-medium text-gray-700">{event.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {format(new Date(event.date), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}