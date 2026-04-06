"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@connect/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Edit3, Trash2, ChevronLeft, Save, Users } from 'lucide-react';
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

const categories = [
  { value: 'worship', label: 'Adoración' },
  { value: 'youth', label: 'Jóvenes' },
  { value: 'women', label: 'Mujeres' },
  { value: 'men', label: 'Hombres' },
  { value: 'children', label: 'Niños' },
  { value: 'community', label: 'Comunidad' },
  { value: 'special', label: 'Especial' },
];

export default function AdminEvents() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', date: '', end_date: '', location: '',
    image_url: '', requires_registration: false, max_attendees: '',
    is_published: true, category: 'community'
  });

  const queryClient = useQueryClient();

  useEffect(() => { loadUser(); }, []);
  const loadUser = async () => {
    try { setUser(await api.auth.me()); } catch (e) { setUser(null); }
  };

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['adminEvents'],
    queryFn: () => api.entities.Event.list('-date'),
    enabled: user?.role === 'admin',
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Event.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      resetForm(); toast.success('Evento creado');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Event.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      resetForm(); toast.success('Evento actualizado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      toast.success('Evento eliminado');
    },
  });

  const resetForm = () => {
    setShowForm(false); setEditing(null);
    setFormData({
      title: '', description: '', date: '', end_date: '', location: '',
      image_url: '', requires_registration: false, max_attendees: '',
      is_published: true, category: 'community'
    });
  };

  const handleEdit = (item) => {
    setEditing(item);
    setFormData({ 
      ...item, 
      date: item.date ? item.date.slice(0, 16) : '',
      max_attendees: item.max_attendees?.toString() || ''
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      toast.error('Completa los campos requeridos'); return;
    }
    const data = {
      ...formData,
      max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center"><p>Acceso restringido</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Gestionar Eventos</h1>
        </div>
        <Button onClick={() => setShowForm(true)} className="w-full bg-white text-blue-700 hover:bg-white/90">
          <Plus className="w-4 h-4 mr-2" />Nuevo Evento
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : events.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{item.title}</h3>
                    <Badge variant="outline">{categories.find(c => c.value === item.category)?.label || item.category}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.date && format(new Date(item.date), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                  </p>
                  {item.requires_registration && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {item.registration_count || 0}{item.max_attendees ? ` / ${item.max_attendees}` : ''} registrados
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit3 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar' : 'Nuevo'} Evento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Título *</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
            <div><Label>Categoría</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fecha y Hora *</Label><Input type="datetime-local" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} /></div>
              <div><Label>Fecha Fin</Label><Input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} /></div>
            </div>
            <div><Label>Ubicación</Label><Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} /></div>
            <div><Label>Descripción</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} /></div>
            <div><Label>URL de Imagen</Label><Input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} /></div>
            <div className="flex items-center justify-between">
              <Label>Requiere Registro</Label>
              <Switch checked={formData.requires_registration} onCheckedChange={(checked) => setFormData({...formData, requires_registration: checked})} />
            </div>
            {formData.requires_registration && (
              <div><Label>Cupo Máximo</Label><Input type="number" value={formData.max_attendees} onChange={(e) => setFormData({...formData, max_attendees: e.target.value})} placeholder="Dejar vacío para ilimitado" /></div>
            )}
            <div className="flex items-center justify-between">
              <Label>Publicado</Label>
              <Switch checked={formData.is_published} onCheckedChange={(checked) => setFormData({...formData, is_published: checked})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700"><Save className="w-4 h-4 mr-2" />Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}