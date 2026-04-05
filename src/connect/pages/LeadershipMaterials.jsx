"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@connect/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Video, 
  FileAudio, 
  File, 
  Upload,
  Search,
  Filter,
  Plus,
  Download,
  ExternalLink,
  Trash2,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Input } from '@connect/components/ui/input';
import { Label } from '@connect/components/ui/label';
import { Textarea } from '@connect/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@connect/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@connect/components/ui/dialog';
import { Card, CardContent } from '@connect/components/ui/card';
import { Badge } from '@connect/components/ui/badge';
import { Skeleton } from '@connect/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@connect/components/ui/tabs';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from '@connect/lib/router-compat';
import { createPageUrl } from '@connect/utils';

const typeIcons = {
  pdf: FileText,
  video: Video,
  audio: FileAudio,
  document: File,
  presentation: FileText,
};

const ministryLabels = {
  general: 'General',
  youth: 'Jóvenes',
  women: 'Mujeres',
  men: 'Hombres',
  children: 'Niños',
  worship: 'Adoración',
  leadership: 'Liderazgo',
};

const ministryColors = {
  general: 'bg-gray-100 text-gray-700',
  youth: 'bg-blue-100 text-blue-700',
  women: 'bg-pink-100 text-pink-700',
  men: 'bg-indigo-100 text-indigo-700',
  children: 'bg-green-100 text-green-700',
  worship: 'bg-purple-100 text-purple-700',
  leadership: 'bg-amber-100 text-amber-700',
};

export default function LeadershipMaterials() {
  const [user, setUser] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'pdf',
    ministry: 'general',
    category: '',
    file_url: '',
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (e) {
      setUser(null);
    }
  };

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.MinistryMaterial.list('-created_date'),
    enabled: user?.role === 'admin',
  });

  const createMaterialMutation = useMutation({
    mutationFn: (data) => base44.entities.MinistryMaterial.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setShowUpload(false);
      setFormData({
        title: '',
        description: '',
        type: 'pdf',
        ministry: 'general',
        category: '',
        file_url: '',
      });
      toast.success('Material subido exitosamente');
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: (id) => base44.entities.MinistryMaterial.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material eliminado');
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, file_url: result.file_url });
      toast.success('Archivo subido');
    } catch (error) {
      toast.error('Error al subir el archivo');
    }
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.file_url) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }
    createMaterialMutation.mutate(formData);
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = !searchQuery || 
      m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMinistry = selectedMinistry === 'all' || m.ministry === selectedMinistry;
    return matchesSearch && matchesMinistry;
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Acceso restringido a líderes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-600 to-amber-700 px-4 py-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Materiales de Estudio</h1>
            <p className="text-white/80 text-sm">Recursos para el liderazgo</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowUpload(true)}
          className="w-full bg-white text-amber-700 hover:bg-white/90"
        >
          <Upload className="w-4 h-4 mr-2" />
          Subir Material
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar materiales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedMinistry} onValueChange={setSelectedMinistry}>
          <SelectTrigger>
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por ministerio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los ministerios</SelectItem>
            {Object.entries(ministryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Materials List */}
      <div className="p-4 pt-0 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay materiales disponibles</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredMaterials.map((material, index) => {
              const Icon = typeIcons[material.type] || File;
              
              return (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-50 rounded-xl">
                          <Icon className="w-6 h-6 text-amber-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{material.title}</h3>
                          {material.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{material.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={ministryColors[material.ministry]}>
                              {ministryLabels[material.ministry]}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {format(new Date(material.created_date), 'd MMM yyyy', { locale: es })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a 
                            href={material.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="icon">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => deleteMaterialMutation.mutate(material.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subir Material</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                    <SelectItem value="presentation">Presentación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ministerio</Label>
                <Select
                  value={formData.ministry}
                  onValueChange={(value) => setFormData({ ...formData, ministry: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ministryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="file">Archivo *</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploading && (
                <p className="text-xs text-gray-500 mt-1">Subiendo archivo...</p>
              )}
              {formData.file_url && (
                <p className="text-xs text-green-600 mt-1">✓ Archivo subido</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-amber-600 hover:bg-amber-700"
                disabled={createMaterialMutation.isPending || uploading}
              >
                Subir Material
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}