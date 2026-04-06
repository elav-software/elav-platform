"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@connect/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Radio, Plus, Edit3, Trash2, ChevronLeft, Save, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Input } from '@connect/components/ui/input';
import { Label } from '@connect/components/ui/label';
import { Textarea } from '@connect/components/ui/textarea';
import { Switch } from '@connect/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@connect/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@connect/components/ui/dialog';
import { Card, CardContent } from '@connect/components/ui/card';
import { Badge } from '@connect/components/ui/badge';
import { Skeleton } from '@connect/components/ui/skeleton';
import { toast } from 'sonner';
import { Link } from '@connect/lib/router-compat';
import { createPageUrl } from '@connect/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const serviceTypes = [
  { value: 'sunday_service', label: 'Servicio Dominical' },
  { value: 'wednesday_service', label: 'Servicio de Miércoles' },
  { value: 'youth', label: 'Jóvenes' },
  { value: 'prayer_meeting', label: 'Reunión de Oración' },
  { value: 'special_event', label: 'Evento Especial' },
];

export default function AdminServices() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '', type: 'sunday_service', date: '', description: '',
    is_live: false, stream_url: '', thumbnail_url: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => { loadUser(); }, []);
  const loadUser = async () => {
    try { setUser(await api.auth.me()); } catch (e) { setUser(null); }
  };

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['adminServices'],
    queryFn: () => api.entities.Service.list('-date'),
    enabled: user?.role === 'admin',
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Service.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminServices'] });
      resetForm(); toast.success('Servicio creado');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminServices'] });
      resetForm(); toast.success('Servicio actualizado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminServices'] });
      toast.success('Servicio eliminado');
    },
  });

  const toggleLive = async (service) => {
    await api.entities.Service.update(service.id, { is_live: !service.is_live });
    queryClient.invalidateQueries({ queryKey: ['adminServices'] });
    toast.success(service.is_live ? 'Transmisión finalizada' : 'Transmisión iniciada');
  };

  const resetForm = () => {
    setShowForm(false); setEditing(null);
    setFormData({
      title: '', type: 'sunday_service', date: '', description: '',
      is_live: false, stream_url: '', thumbnail_url: ''
    });
  };

  const handleEdit = (item) => {
    setEditing(item);
    setFormData({ 
      ...item, 
      date: item.date ? item.date.slice(0, 16) : ''
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      toast.error('Completa los campos requeridos'); return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center"><p>Acceso restringido</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 px-4 py-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Gestionar Servicios</h1>
        </div>
        <Button onClick={() => setShowForm(true)} className="w-full bg-white text-slate-700 hover:bg-white/90">
          <Plus className="w-4 h-4 mr-2" />Nuevo Servicio
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : services.map((item) => (
          <Card key={item.id} className={item.is_live ? 'border-red-300 bg-red-50/50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.is_live && (
                      <Badge className="bg-red-500 text-white animate-pulse">
                        <Wifi className="w-3 h-3 mr-1" />EN VIVO
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {serviceTypes.find(t => t.value === item.type)?.label || item.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.date && format(new Date(item.date), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant={item.is_live ? "destructive" : "outline"} 
                    size="sm"
                    onClick={() => toggleLive(item)}
                  >
                    {item.is_live ? <WifiOff className="w-4 h-4 mr-1" /> : <Wifi className="w-4 h-4 mr-1" />}
                    {item.is_live ? 'Detener' : 'Iniciar'}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit3 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar' : 'Nuevo'} Servicio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Título *</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Ej: Servicio Dominical de Adoración" /></div>
            <div><Label>Tipo</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {serviceTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Fecha y Hora *</Label><Input type="datetime-local" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} /></div>
            <div><Label>URL de Transmisión</Label><Input value={formData.stream_url} onChange={(e) => setFormData({...formData, stream_url: e.target.value})} placeholder="URL de YouTube, Vimeo, etc." /></div>
            <div><Label>Descripción</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" className="bg-slate-700 hover:bg-slate-800"><Save className="w-4 h-4 mr-2" />Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}