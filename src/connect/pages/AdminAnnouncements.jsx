"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@connect/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus, Edit3, Trash2, ChevronLeft, Save, AlertTriangle } from 'lucide-react';
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

const priorities = [
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  { value: 'important', label: 'Importante', color: 'bg-amber-100 text-amber-700' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-700' },
];

export default function AdminAnnouncements() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '', content: '', image_url: '', priority: 'normal',
    publish_date: new Date().toISOString().split('T')[0], expiry_date: '', is_published: true
  });

  const queryClient = useQueryClient();

  useEffect(() => { loadUser(); }, []);
  const loadUser = async () => {
    try { setUser(await api.auth.me()); } catch (e) { setUser(null); }
  };

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['adminAnnouncements'],
    queryFn: () => api.entities.Announcement.list('-publish_date'),
    enabled: user?.role === 'admin',
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Announcement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAnnouncements'] });
      resetForm(); toast.success('Anuncio creado');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Announcement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAnnouncements'] });
      resetForm(); toast.success('Anuncio actualizado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Announcement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAnnouncements'] });
      toast.success('Anuncio eliminado');
    },
  });

  const resetForm = () => {
    setShowForm(false); setEditing(null);
    setFormData({
      title: '', content: '', image_url: '', priority: 'normal',
      publish_date: new Date().toISOString().split('T')[0], expiry_date: '', is_published: true
    });
  };

  const handleEdit = (item) => {
    setEditing(item);
    setFormData({ ...item });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
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
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 px-4 py-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Gestionar Anuncios</h1>
        </div>
        <Button onClick={() => setShowForm(true)} className="w-full bg-white text-purple-700 hover:bg-white/90">
          <Plus className="w-4 h-4 mr-2" />Nuevo Anuncio
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : announcements.map((item) => {
          const priority = priorities.find(p => p.value === item.priority) || priorities[0];
          return (
            <Card key={item.id} className={item.priority === 'urgent' ? 'border-red-200' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{item.title}</h3>
                      <Badge className={priority.color}>{priority.label}</Badge>
                      {!item.is_published && <Badge variant="outline">Borrador</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{item.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.publish_date && format(new Date(item.publish_date), 'd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit3 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar' : 'Nuevo'} Anuncio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Título *</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
            <div><Label>Contenido *</Label><Textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} rows={4} /></div>
            <div><Label>Prioridad</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {priorities.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fecha de Publicación</Label><Input type="date" value={formData.publish_date} onChange={(e) => setFormData({...formData, publish_date: e.target.value})} /></div>
              <div><Label>Fecha de Expiración</Label><Input type="date" value={formData.expiry_date} onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} /></div>
            </div>
            <div><Label>URL de Imagen</Label><Input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} /></div>
            <div className="flex items-center justify-between">
              <Label>Publicado</Label>
              <Switch checked={formData.is_published} onCheckedChange={(checked) => setFormData({...formData, is_published: checked})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700"><Save className="w-4 h-4 mr-2" />Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}