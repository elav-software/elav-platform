import React, { useState, useEffect } from 'react';
import { base44 } from '@connect/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Edit3, Trash2, ChevronLeft, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Input } from '@connect/components/ui/input';
import { Label } from '@connect/components/ui/label';
import { Textarea } from '@connect/components/ui/textarea';
import { Switch } from '@connect/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@connect/components/ui/dialog';
import { Card, CardContent } from '@connect/components/ui/card';
import { Badge } from '@connect/components/ui/badge';
import { Skeleton } from '@connect/components/ui/skeleton';
import { toast } from 'sonner';
import { Link } from '@connect/lib/router-compat';
import { createPageUrl } from '@connect/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDevotionals() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '', content: '', scripture: '', scripture_text: '',
    author: '', publish_date: '', image_url: '', is_published: false
  });

  const queryClient = useQueryClient();

  useEffect(() => { loadUser(); }, []);
  const loadUser = async () => {
    try { setUser(await base44.auth.me()); } catch (e) { setUser(null); }
  };

  const { data: devotionals = [], isLoading } = useQuery({
    queryKey: ['adminDevotionals'],
    queryFn: () => base44.entities.Devotional.list('-publish_date'),
    enabled: user?.role === 'admin',
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Devotional.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDevotionals'] });
      resetForm(); toast.success('Devocional creado');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Devotional.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDevotionals'] });
      resetForm(); toast.success('Devocional actualizado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Devotional.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDevotionals'] });
      toast.success('Devocional eliminado');
    },
  });

  const resetForm = () => {
    setShowForm(false); setEditing(null);
    setFormData({ title: '', content: '', scripture: '', scripture_text: '', author: '', publish_date: '', image_url: '', is_published: false });
  };

  const handleEdit = (item) => {
    setEditing(item);
    setFormData({ ...item });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.scripture) {
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
      <div className="bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Gestionar Devocionales</h1>
        </div>
        <Button onClick={() => setShowForm(true)} className="w-full bg-white text-amber-700 hover:bg-white/90">
          <Plus className="w-4 h-4 mr-2" />Nuevo Devocional
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : devotionals.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.is_published ? (
                    <Badge className="bg-green-100 text-green-700"><Eye className="w-3 h-3 mr-1" />Publicado</Badge>
                  ) : (
                    <Badge variant="outline"><EyeOff className="w-3 h-3 mr-1" />Borrador</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">{item.scripture} • {item.publish_date && format(new Date(item.publish_date), 'd MMM yyyy', { locale: es })}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit3 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar' : 'Nuevo'} Devocional</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Título *</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
            <div><Label>Referencia Bíblica *</Label><Input value={formData.scripture} onChange={(e) => setFormData({...formData, scripture: e.target.value})} placeholder="Ej: Juan 3:16" /></div>
            <div><Label>Texto del Versículo</Label><Textarea value={formData.scripture_text} onChange={(e) => setFormData({...formData, scripture_text: e.target.value})} rows={2} /></div>
            <div><Label>Contenido *</Label><Textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} rows={6} placeholder="Escribe el devocional (puedes usar Markdown)..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Autor</Label><Input value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} /></div>
              <div><Label>Fecha de Publicación</Label><Input type="date" value={formData.publish_date} onChange={(e) => setFormData({...formData, publish_date: e.target.value})} /></div>
            </div>
            <div><Label>URL de Imagen</Label><Input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} /></div>
            <div className="flex items-center justify-between">
              <Label>Publicar</Label>
              <Switch checked={formData.is_published} onCheckedChange={(checked) => setFormData({...formData, is_published: checked})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700"><Save className="w-4 h-4 mr-2" />Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}