"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@connect/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  HandHeart, 
  Plus, 
  Heart, 
  Lock, 
  Globe, 
  Send,
  X,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Input } from '@connect/components/ui/input';
import { Textarea } from '@connect/components/ui/textarea';
import { Label } from '@connect/components/ui/label';
import { Switch } from '@connect/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@connect/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@connect/components/ui/tabs';
import { Badge } from '@connect/components/ui/badge';
import { Skeleton } from '@connect/components/ui/skeleton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Prayer() {
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    requester_name: '',
    is_public: true,
    is_confidential: false,
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
        requester_email: currentUser.email,
      }));
    } catch (e) {
      setUser(null);
    }
  };

  const { data: publicRequests = [], isLoading: loadingPublic } = useQuery({
    queryKey: ['prayerRequests', 'public'],
    queryFn: () => base44.entities.PrayerRequest.filter({ is_public: true, status: 'active' }, '-created_date'),
  });

  const { data: myRequests = [], isLoading: loadingMy } = useQuery({
    queryKey: ['prayerRequests', 'my'],
    queryFn: () => base44.entities.PrayerRequest.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.PrayerRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerRequests'] });
      setShowForm(false);
      setFormData({
        title: '',
        content: '',
        requester_name: user?.full_name || '',
        is_public: true,
        is_confidential: false,
      });
      toast.success('Pedido de oración enviado');
    },
  });

  const prayForMutation = useMutation({
    mutationFn: async (request) => {
      return base44.entities.PrayerRequest.update(request.id, {
        prayer_count: (request.prayer_count || 0) + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerRequests'] });
      toast.success('¡Gracias por orar!');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast.error('Por favor escribe tu pedido de oración');
      return;
    }
    createRequestMutation.mutate(formData);
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    answered: 'bg-blue-100 text-blue-700',
    archived: 'bg-gray-100 text-gray-700',
  };

  const statusLabels = {
    active: 'Activo',
    answered: 'Respondido',
    archived: 'Archivado',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 px-4 py-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <HandHeart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Muro de Oración</h1>
            <p className="text-white/80 text-sm">Oramos unos por otros</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowForm(true)}
          className="w-full bg-white text-red-600 hover:bg-white/90 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Pedido de Oración
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs defaultValue="public" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="public">
              <Globe className="w-4 h-4 mr-2" />
              Públicos
            </TabsTrigger>
            <TabsTrigger value="my" disabled={!user}>
              <Lock className="w-4 h-4 mr-2" />
              Mis Pedidos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="public" className="space-y-4">
            {loadingPublic ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))
            ) : publicRequests.length === 0 ? (
              <div className="text-center py-12">
                <HandHeart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay pedidos de oración públicos</p>
                <p className="text-gray-400 text-sm mt-1">Sé el primero en compartir</p>
              </div>
            ) : (
              <AnimatePresence>
                {publicRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl p-4 shadow-sm border"
                  >
                    {request.title && (
                      <h3 className="font-semibold text-gray-900 mb-2">{request.title}</h3>
                    )}
                    <p className="text-gray-700 text-sm leading-relaxed">{request.content}</p>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{request.requester_name || 'Anónimo'}</span>
                        <span>•</span>
                        <span>{format(new Date(request.created_date), 'd MMM', { locale: es })}</span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => prayForMutation.mutate(request)}
                      >
                        <Heart className="w-4 h-4 mr-1" />
                        Oré ({request.prayer_count || 0})
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </TabsContent>
          
          <TabsContent value="my" className="space-y-4">
            {!user ? (
              <div className="text-center py-12">
                <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Inicia sesión para ver tus pedidos</p>
                <Button 
                  onClick={() => base44.auth.redirectToLogin()}
                  className="mt-4 bg-red-600 hover:bg-red-700"
                >
                  Iniciar Sesión
                </Button>
              </div>
            ) : loadingMy ? (
              Array(2).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))
            ) : myRequests.length === 0 ? (
              <div className="text-center py-12">
                <HandHeart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tienes pedidos de oración</p>
              </div>
            ) : (
              <AnimatePresence>
                {myRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl p-4 shadow-sm border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      {request.title && (
                        <h3 className="font-semibold text-gray-900">{request.title}</h3>
                      )}
                      <div className="flex items-center gap-2">
                        {request.is_confidential && (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Confidencial
                          </Badge>
                        )}
                        <Badge className={statusColors[request.status]}>
                          {statusLabels[request.status]}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{request.content}</p>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {format(new Date(request.created_date), "d 'de' MMMM, yyyy", { locale: es })}
                      </div>
                      {request.is_public && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-red-500" />
                          {request.prayer_count || 0} oraciones
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* New Request Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HandHeart className="w-5 h-5 text-red-600" />
              Nuevo Pedido de Oración
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Título (opcional)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Salud de mi familia"
              />
            </div>
            
            <div>
              <Label htmlFor="content">Tu pedido de oración *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Comparte tu necesidad de oración..."
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="name">Tu nombre (opcional)</Label>
              <Input
                id="name"
                value={formData.requester_name}
                onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
                placeholder="Se mostrará como 'Anónimo' si lo dejas vacío"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Pedido público</Label>
                  <p className="text-xs text-gray-500">Otros podrán ver y orar por ti</p>
                </div>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Confidencial (solo pastores)</Label>
                  <p className="text-xs text-gray-500">Solo el equipo pastoral verá tu pedido</p>
                </div>
                <Switch
                  checked={formData.is_confidential}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    is_confidential: checked,
                    is_public: checked ? false : formData.is_public,
                  })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-red-600 hover:bg-red-700"
                disabled={createRequestMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Pedido
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}