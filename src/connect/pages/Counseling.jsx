"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@connect/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Heart, 
  Calendar, 
  Clock, 
  Phone,
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Input } from '@connect/components/ui/input';
import { Textarea } from '@connect/components/ui/textarea';
import { Label } from '@connect/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@connect/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@connect/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@connect/components/ui/card';
import { Badge } from '@connect/components/ui/badge';
import { Skeleton } from '@connect/components/ui/skeleton';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const topics = [
  { value: 'marriage', label: 'Matrimonio', icon: '💑' },
  { value: 'family', label: 'Familia', icon: '👨‍👩‍👧‍👦' },
  { value: 'spiritual', label: 'Vida Espiritual', icon: '🙏' },
  { value: 'personal', label: 'Personal', icon: '💭' },
  { value: 'crisis', label: 'Crisis', icon: '🆘' },
  { value: 'other', label: 'Otro', icon: '📝' },
];

const timeSlots = [
  { value: 'morning', label: 'Mañana (9:00 - 12:00)' },
  { value: 'afternoon', label: 'Tarde (14:00 - 18:00)' },
  { value: 'evening', label: 'Noche (19:00 - 21:00)' },
];

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-700', label: 'Pendiente', icon: Clock },
  scheduled: { color: 'bg-blue-100 text-blue-700', label: 'Agendado', icon: Calendar },
  completed: { color: 'bg-green-100 text-green-700', label: 'Completado', icon: CheckCircle },
  cancelled: { color: 'bg-gray-100 text-gray-700', label: 'Cancelado', icon: AlertCircle },
};

export default function Counseling() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    requester_name: '',
    requester_email: '',
    requester_phone: '',
    topic: '',
    brief_description: '',
    preferred_date: '',
    preferred_time: 'afternoon',
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData(prev => ({
        ...prev,
        requester_name: currentUser.full_name || '',
        requester_email: currentUser.email || '',
      }));
    } catch (e) {
      setUser(null);
    }
  };

  const { data: myRequests = [], isLoading } = useQuery({
    queryKey: ['counselingRequests', user?.email],
    queryFn: () => base44.entities.CounselingRequest.filter({ requester_email: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.CounselingRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counselingRequests'] });
      toast.success('Solicitud enviada. Nos contactaremos contigo pronto.');
      setFormData({
        requester_name: user?.full_name || '',
        requester_email: user?.email || '',
        requester_phone: '',
        topic: '',
        brief_description: '',
        preferred_date: '',
        preferred_time: 'afternoon',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.requester_name || !formData.requester_email || !formData.topic) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    createRequestMutation.mutate(formData);
  };

  // Generate next 14 days for date selection
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i + 1);
    const dayOfWeek = date.getDay();
    // Skip Sundays (0) and Saturdays (6) for simplicity
    if (dayOfWeek === 0) return null;
    return date;
  }).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 px-4 py-8 text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Consejería Pastoral</h1>
            <p className="text-white/80 text-sm">Estamos aquí para acompañarte</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Info Card */}
        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-purple-800 font-medium">Confidencialidad Garantizada</p>
                <p className="text-xs text-purple-600 mt-1">
                  Todas las sesiones son completamente privadas. Nuestros pastores están 
                  capacitados para brindarte apoyo espiritual y emocional.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Requests */}
        {user && myRequests.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Mis Solicitudes
            </h2>
            {isLoading ? (
              <Skeleton className="h-20 rounded-xl" />
            ) : (
              myRequests.slice(0, 3).map((request) => {
                const status = statusConfig[request.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const topicData = topics.find(t => t.value === request.topic);

                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-4 border shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{topicData?.icon}</span>
                        <span className="font-medium">{topicData?.label}</span>
                      </div>
                      <Badge className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    
                    {request.scheduled_date && (
                      <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(request.scheduled_date), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-400 mt-2">
                      Solicitado el {format(new Date(request.created_date), "d 'de' MMMM", { locale: es })}
                    </p>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Request Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Solicitar una Cita</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre completo *</Label>
                  <Input
                    id="name"
                    value={formData.requester_name}
                    onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.requester_email}
                    onChange={(e) => setFormData({ ...formData, requester_email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.requester_phone}
                  onChange={(e) => setFormData({ ...formData, requester_phone: e.target.value })}
                  placeholder="Para contactarte más rápidamente"
                />
              </div>

              <div>
                <Label>Área de consejería *</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {topics.map((topic) => (
                    <button
                      key={topic.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, topic: topic.value })}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        formData.topic === topic.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{topic.icon}</span>
                      <span className="text-xs font-medium">{topic.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Breve descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.brief_description}
                  onChange={(e) => setFormData({ ...formData, brief_description: e.target.value })}
                  placeholder="Cuéntanos brevemente el motivo de tu consulta..."
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">Esta información es confidencial</p>
              </div>

              <div>
                <Label>Fecha preferida</Label>
                <Select
                  value={formData.preferred_date}
                  onValueChange={(value) => setFormData({ ...formData, preferred_date: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDates.map((date) => (
                      <SelectItem key={date.toISOString()} value={date.toISOString().split('T')[0]}>
                        {format(date, "EEEE d 'de' MMMM", { locale: es })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Horario preferido</Label>
                <RadioGroup
                  value={formData.preferred_time}
                  onValueChange={(value) => setFormData({ ...formData, preferred_time: value })}
                  className="mt-2 space-y-2"
                >
                  {timeSlots.map((slot) => (
                    <div key={slot.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={slot.value} id={slot.value} />
                      <Label htmlFor={slot.value} className="font-normal cursor-pointer">
                        {slot.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 h-12"
                disabled={createRequestMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {createRequestMutation.isPending ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Contacto Directo</h3>
            <div className="space-y-2 text-sm">
              <a href="tel:+541112345678" className="flex items-center gap-2 text-gray-600 hover:text-purple-600">
                <Phone className="w-4 h-4" />
                +54 11 1234-5678
              </a>
              <a href="mailto:consejeria@cfcisidro.org" className="flex items-center gap-2 text-gray-600 hover:text-purple-600">
                <Mail className="w-4 h-4" />
                consejeria@cfcisidro.org
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}