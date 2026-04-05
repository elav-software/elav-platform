"use client";
import React, { useState, useEffect } from 'react';
import { base44 } from '@connect/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Search, 
  Trash2, 
  Edit3,
  ChevronLeft,
  Calendar,
  Save
} from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Input } from '@connect/components/ui/input';
import { Textarea } from '@connect/components/ui/textarea';
import { Skeleton } from '@connect/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@connect/components/ui/alert-dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

export default function MyNotes() {
  const [user, setUser] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['sermonNotes', user?.email],
    queryFn: () => base44.entities.SermonNote.filter({ created_by: user?.email }, '-date'),
    enabled: !!user,
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, content }) => base44.entities.SermonNote.update(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermonNotes'] });
      toast.success('Notas actualizadas');
      setIsEditing(false);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id) => base44.entities.SermonNote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermonNotes'] });
      toast.success('Notas eliminadas');
      setSelectedNote(null);
    },
  });

  const filteredNotes = searchQuery
    ? notes.filter(n => 
        n.sermon_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes;

  const handleStartEdit = () => {
    setEditContent(selectedNote.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateNoteMutation.mutate({ id: selectedNote.id, content: editContent });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Mis Notas</h2>
          <p className="text-gray-500 mb-4">Inicia sesión para ver tus notas de sermones</p>
          <Button 
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-red-600 hover:bg-red-700"
          >
            Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  if (selectedNote) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setSelectedNote(null);
                setIsEditing(false);
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              {isEditing ? (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={updateNoteMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Guardar
                </Button>
              ) : (
                <Button variant="ghost" size="icon" onClick={handleStartEdit}>
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar estas notas?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Las notas de "{selectedNote.sermon_title}" serán eliminadas permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteNoteMutation.mutate(selectedNote.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{selectedNote.sermon_title}</h1>
          <p className="text-sm text-gray-500 flex items-center gap-2 mb-6">
            <Calendar className="w-4 h-4" />
            {selectedNote.date && format(new Date(selectedNote.date), "d 'de' MMMM, yyyy", { locale: es })}
          </p>

          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[400px] font-mono"
              placeholder="Escribe tus notas aquí..."
            />
          ) : (
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 px-4 py-8 text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Mis Notas</h1>
            <p className="text-white/80 text-sm">Notas de sermones guardadas</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 -mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar en mis notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="p-4 pt-0 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? 'No se encontraron notas' : 'No tienes notas guardadas'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Toma notas durante los sermones para guardarlas aquí
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedNote(note)}
                className="bg-white rounded-xl p-4 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 line-clamp-1">{note.sermon_title}</h3>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {note.date && format(new Date(note.date), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{note.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}