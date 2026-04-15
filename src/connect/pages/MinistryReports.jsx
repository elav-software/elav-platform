"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@connect/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ClipboardList, 
  Plus, 
  Calendar,
  Users,
  ChevronLeft,
  Send,
  FileText
} from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Input } from '@connect/components/ui/input';
import { Label } from '@connect/components/ui/label';
import { Textarea } from '@connect/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@connect/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@connect/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@connect/components/ui/card';
import { Badge } from '@connect/components/ui/badge';
import { Skeleton } from '@connect/components/ui/skeleton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from '@connect/lib/router-compat';
import { createPageUrl } from '@connect/utils';

const ministries = [
  { value: 'youth', label: 'Jóvenes', color: 'bg-blue-100 text-blue-700' },
  { value: 'women', label: 'Mujeres', color: 'bg-pink-100 text-pink-700' },
  { value: 'men', label: 'Hombres', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'children', label: 'Niños', color: 'bg-green-100 text-green-700' },
  { value: 'worship', label: 'Adoración', color: 'bg-purple-100 text-purple-700' },
  { value: 'outreach', label: 'Evangelismo', color: 'bg-orange-100 text-orange-700' },
  { value: 'small_groups', label: 'Grupos Pequeños', color: 'bg-amber-100 text-amber-700' },
];

export default function MinistryReports() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState('all');
  const [formData, setFormData] = useState({
    ministry: '',
    report_date: new Date().toISOString().split('T')[0],
    attendance: '',
    new_visitors: 0,
    summary: '',
    highlights: '',
    prayer_needs: '',
    challenges: '',
    next_steps: '',
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await api.auth.me();
      setUser(currentUser);
    } catch (e) {
      setUser(null);
    }
  };

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['ministryReports'],
    queryFn: () => api.entities.MinistryReport.list('-report_date', 50),
    enabled: user?.role === 'admin',
  });

  const createReportMutation = useMutation({
    mutationFn: (data) => api.entities.MinistryReport.create({
      ...data,
      submitted_by: user?.full_name || user?.email,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministryReports'] });
      setShowForm(false);
      setFormData({
        ministry: '',
        report_date: new Date().toISOString().split('T')[0],
        attendance: '',
        new_visitors: 0,
        summary: '',
        highlights: '',
        prayer_needs: '',
        challenges: '',
        next_steps: '',
      });
      toast.success('Reporte enviado exitosamente');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.ministry || !formData.summary) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }
    createReportMutation.mutate({
      ...formData,
      attendance: formData.attendance ? parseInt(formData.attendance) : null,
    });
  };

  const filteredReports = selectedMinistry === 'all' 
    ? reports 
    : reports.filter(r => r.ministry === selectedMinistry);

  const getMinistryConfig = (ministry) => {
    return ministries.find(m => m.value === ministry) || { label: ministry, color: 'bg-gray-100 text-gray-700' };
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Acceso restringido a líderes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-4 py-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Reportes de Ministerios</h1>
            <p className="text-white/80 text-sm">Informes semanales</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowForm(true)}
          className="w-full bg-white text-teal-700 hover:bg-white/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Reporte
        </Button>
      </div>

      {/* Filter */}
      <div className="p-4">
        <Select value={selectedMinistry} onValueChange={setSelectedMinistry}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por ministerio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los ministerios</SelectItem>
            {ministries.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      <div className="p-4 pt-0 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay reportes disponibles</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredReports.map((report, index) => {
              const ministryConfig = getMinistryConfig(report.ministry);
              
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className={ministryConfig.color}>
                            {ministryConfig.label}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(report.report_date), "d 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        </div>
                        {report.attendance && (
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Users className="w-4 h-4" />
                              <span className="font-bold">{report.attendance}</span>
                            </div>
                            {report.new_visitors > 0 && (
                              <p className="text-xs text-green-600">+{report.new_visitors} nuevos</p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 text-sm">{report.summary}</p>
                      
                      {report.highlights && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                          <p className="text-xs font-semibold text-green-700 mb-1">Destacados</p>
                          <p className="text-sm text-green-800">{report.highlights}</p>
                        </div>
                      )}
                      
                      {report.prayer_needs && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                          <p className="text-xs font-semibold text-amber-700 mb-1">Necesidades de Oración</p>
                          <p className="text-sm text-amber-800">{report.prayer_needs}</p>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-400 mt-3">
                        Enviado por {report.submitted_by}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* New Report Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Reporte de Ministerio</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ministerio *</Label>
                <Select
                  value={formData.ministry}
                  onValueChange={(value) => setFormData({ ...formData, ministry: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {ministries.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Fecha del Reporte</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.report_date}
                  onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="attendance">Asistencia</Label>
                <Input
                  id="attendance"
                  type="number"
                  value={formData.attendance}
                  onChange={(e) => setFormData({ ...formData, attendance: e.target.value })}
                  placeholder="Número de personas"
                />
              </div>

              <div>
                <Label htmlFor="visitors">Visitantes Nuevos</Label>
                <Input
                  id="visitors"
                  type="number"
                  value={formData.new_visitors}
                  onChange={(e) => setFormData({ ...formData, new_visitors: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="summary">Resumen de Actividades *</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={3}
                placeholder="Describe las actividades realizadas..."
              />
            </div>

            <div>
              <Label htmlFor="highlights">Destacados</Label>
              <Textarea
                id="highlights"
                value={formData.highlights}
                onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                rows={2}
                placeholder="Testimonios, logros, momentos especiales..."
              />
            </div>

            <div>
              <Label htmlFor="prayer">Necesidades de Oración</Label>
              <Textarea
                id="prayer"
                value={formData.prayer_needs}
                onChange={(e) => setFormData({ ...formData, prayer_needs: e.target.value })}
                rows={2}
                placeholder="Peticiones de oración del ministerio..."
              />
            </div>

            <div>
              <Label htmlFor="challenges">Desafíos</Label>
              <Textarea
                id="challenges"
                value={formData.challenges}
                onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                rows={2}
                placeholder="Obstáculos o áreas de mejora..."
              />
            </div>

            <div>
              <Label htmlFor="next">Próximos Pasos</Label>
              <Textarea
                id="next"
                value={formData.next_steps}
                onChange={(e) => setFormData({ ...formData, next_steps: e.target.value })}
                rows={2}
                placeholder="Planes para la próxima semana..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-teal-600 hover:bg-teal-700"
                disabled={createReportMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Reporte
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}