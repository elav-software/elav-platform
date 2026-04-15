"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@connect/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Video, Plus, Edit3, Trash2, ChevronLeft, Save, X } from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Input } from '@connect/components/ui/input';
import { Label } from '@connect/components/ui/label';
import { Textarea } from '@connect/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@connect/components/ui/dialog';
import { Card, CardContent } from '@connect/components/ui/card';
import { Skeleton } from '@connect/components/ui/skeleton';
import { toast } from 'sonner';
import { Link } from '@connect/lib/router-compat';
import { createPageUrl } from '@connect/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminSermons() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSermon, setEditingSermon] = useState(null);
  const [formData, setFormData] = useState({
    title: '', speaker: '', date: '', description: '', video_url: '',
    thumbnail_url: '', series: '', duration: '', outline: '', scripture_references: []
  });

  const queryClient = useQueryClient();

  useEffect(() => { loadUser(); }, []);
  const loadUser = async () => {
    try { setUser(await api.auth.me()); } catch (e) { setUser(null); }
  };

  const { data: sermons = [], isLoading } = useQuery({
    queryKey: ['adminSermons'],
    queryFn: () => api.entities.Sermon.list('-date'),
    enabled: user?.role === 'admin',
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Sermon.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSermons'] });
      resetForm(); toast.success('Sermón creado');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Sermon.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSermons'] });
      resetForm(); toast.success('Sermón actualizado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Sermon.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSermons'] });
      toast.success('Sermón eliminado');
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingSermon(null);
    setFormData({
      title: '', speaker: '', date: '', description: '', video_url: '',
      thumbnail_url: '', series: '', duration: '', outline: '', scripture_references: []
    });
  };

  const handleEdit = (sermon) => {
    setEditingSermon(sermon);
    setFormData({ ...sermon, scripture_references: sermon.scripture_references || [] });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.speaker) {
      toast.error('Completa los campos requeridos'); return;
    }
    if (editingSermon) {
      updateMutation.mutate({ id: editingSermon.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center"><p>Acceso restringido</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-red-600 to-red-700 px-4 py-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Gestionar Sermones</h1>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="w-full bg-white text-red-700 hover:bg-white/90">
          <Plus className="w-4 h-4 mr-2" />Nuevo Sermón
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : sermons.map((sermon) => (
          <Card key={sermon.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{sermon.title}</h3>
                <p className="text-sm text-gray-500">{sermon.speaker} • {sermon.date && format(new Date(sermon.date), 'd MMM yyyy', { locale: es })}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(sermon)}><Edit3 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMutation.mutate(sermon.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSermon ? 'Editar' : 'Nuevo'} Sermón</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Título *</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Predicador *</Label><Input value={formData.speaker} onChange={(e) => setFormData({...formData, speaker: e.target.value})} /></div>
              <div><Label>Fecha</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} /></div>
            </div>
            <div><Label>URL del Video</Label><Input value={formData.video_url} onChange={(e) => setFormData({...formData, video_url: e.target.value})} placeholder="YouTube, Vimeo..." /></div>
            <div><Label>URL Miniatura</Label><Input value={formData.thumbnail_url} onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Serie</Label><Input value={formData.series} onChange={(e) => setFormData({...formData, series: e.target.value})} /></div>
              <div><Label>Duración</Label><Input value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} placeholder="45:00" /></div>
            </div>
            <div><Label>Descripción</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} /></div>
            <div><Label>Bosquejo (Markdown)</Label><Textarea value={formData.outline} onChange={(e) => setFormData({...formData, outline: e.target.value})} rows={4} placeholder="## Puntos principales..." /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700"><Save className="w-4 h-4 mr-2" />Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}