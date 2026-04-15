"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@connect/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { 
  Play, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Calendar,
  ChevronLeft,
  BookOpen,
  Pencil,
  X
} from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Input } from '@connect/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@connect/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@connect/components/ui/dialog';
import { Skeleton } from '@connect/components/ui/skeleton';
import { ScrollArea } from '@connect/components/ui/scroll-area';
import { Textarea } from '@connect/components/ui/textarea';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

export default function Sermons() {
  const [selectedSermon, setSelectedSermon] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [myNotes, setMyNotes] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
    const params = new URLSearchParams(window.location.search);
    const sermonId = params.get('id');
    if (sermonId) {
      loadSermonById(sermonId);
    }
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await api.auth.me();
      setUser(currentUser);
    } catch (e) {
      setUser(null);
    }
  };

  const loadSermonById = async (id) => {
    try {
      const sermons = await api.entities.Sermon.filter({ id });
      if (sermons.length > 0) {
        setSelectedSermon(sermons[0]);
      }
    } catch (e) {
      console.error('Error loading sermon');
    }
  };

  const { data: sermons = [], isLoading } = useQuery({
    queryKey: ['sermons'],
    queryFn: () => api.entities.Sermon.list('-date'),
  });

  const { data: savedNotes = [] } = useQuery({
    queryKey: ['sermonNotes', selectedSermon?.id],
    queryFn: () => api.entities.SermonNote.filter({ 
      sermon_id: selectedSermon?.id,
      created_by: user?.email 
    }),
    enabled: !!selectedSermon && !!user,
  });

  useEffect(() => {
    if (savedNotes.length > 0) {
      setMyNotes(savedNotes[0].content);
    } else {
      setMyNotes('');
    }
  }, [savedNotes]);

  const filteredSermons = searchQuery
    ? sermons.filter(s => 
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.speaker?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.series?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sermons;

  // Group by series
  const seriesList = [...new Set(sermons.filter(s => s.series).map(s => s.series))];

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  const handleSaveNotes = async () => {
    if (!user) {
      toast.error('Inicia sesión para guardar notas');
      return;
    }
    
    try {
      if (savedNotes.length > 0) {
        await api.entities.SermonNote.update(savedNotes[0].id, { content: myNotes });
      } else {
        await api.entities.SermonNote.create({
          sermon_id: selectedSermon.id,
          sermon_title: selectedSermon.title,
          content: myNotes,
          date: new Date().toISOString().split('T')[0],
        });
      }
      toast.success('Notas guardadas');
    } catch (e) {
      toast.error('Error al guardar notas');
    }
  };

  if (selectedSermon) {
    return (
      <div className="min-h-screen bg-white">
        {/* Video Player */}
        <div className="relative bg-black aspect-video">
          {selectedSermon.video_url ? (
            <iframe
              src={getYouTubeEmbedUrl(selectedSermon.video_url)}
              title={selectedSermon.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : selectedSermon.thumbnail_url ? (
            <img 
              src={selectedSermon.thumbnail_url} 
              alt={selectedSermon.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
              <Play className="w-16 h-16 text-white/80" />
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 bg-black/50 text-white hover:bg-black/70"
            onClick={() => setSelectedSermon(null)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Info */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{selectedSermon.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {selectedSermon.speaker}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {selectedSermon.date && format(new Date(selectedSermon.date), "d 'de' MMMM, yyyy", { locale: es })}
            </span>
            {selectedSermon.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {selectedSermon.duration}
              </span>
            )}
          </div>
          {selectedSermon.series && (
            <span className="inline-block mt-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">
              Serie: {selectedSermon.series}
            </span>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-12 bg-gray-50">
            <TabsTrigger value="description">Descripción</TabsTrigger>
            <TabsTrigger value="outline">Bosquejo</TabsTrigger>
            <TabsTrigger value="notes">Mis Notas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="p-4">
            {selectedSermon.description ? (
              <p className="text-gray-700 leading-relaxed">{selectedSermon.description}</p>
            ) : (
              <p className="text-gray-500 text-center py-8">Sin descripción disponible</p>
            )}
            
            {selectedSermon.scripture_references?.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Referencias Bíblicas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSermon.scripture_references.map((ref, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="outline" className="p-4">
            {selectedSermon.outline ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{selectedSermon.outline}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay bosquejo disponible</p>
            )}
          </TabsContent>
          
          <TabsContent value="notes" className="p-4">
            {!user ? (
              <div className="text-center py-8">
                <Pencil className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Inicia sesión para tomar notas</p>
                <Button 
                  onClick={() => api.auth.redirectToLogin()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Iniciar Sesión
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea
                  value={myNotes}
                  onChange={(e) => setMyNotes(e.target.value)}
                  placeholder="Escribe tus notas aquí..."
                  className="min-h-[200px]"
                />
                <Button 
                  onClick={handleSaveNotes}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Guardar Notas
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Play className="w-5 h-5 text-red-600" />
          <h1 className="font-bold text-lg">Sermones</h1>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por título, predicador o serie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto mb-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {seriesList.slice(0, 3).map((series) => (
                <TabsTrigger key={series} value={series} className="whitespace-nowrap">
                  {series}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {filteredSermons.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No se encontraron sermones</p>
              ) : (
                <AnimatePresence>
                  {filteredSermons.map((sermon, index) => (
                    <SermonCard 
                      key={sermon.id} 
                      sermon={sermon} 
                      index={index}
                      onClick={() => setSelectedSermon(sermon)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </TabsContent>
            
            {seriesList.map((series) => (
              <TabsContent key={series} value={series} className="space-y-4">
                {sermons.filter(s => s.series === series).map((sermon, index) => (
                  <SermonCard 
                    key={sermon.id} 
                    sermon={sermon} 
                    index={index}
                    onClick={() => setSelectedSermon(sermon)}
                  />
                ))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}

function SermonCard({ sermon, index, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="flex gap-4 bg-white rounded-xl p-4 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="relative flex-shrink-0 w-28 aspect-video rounded-lg overflow-hidden bg-gray-200">
        {sermon.thumbnail_url ? (
          <img 
            src={sermon.thumbnail_url} 
            alt={sermon.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
            <Play className="w-6 h-6 text-white/80" />
          </div>
        )}
        {sermon.duration && (
          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {sermon.duration}
          </span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 line-clamp-2">{sermon.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{sermon.speaker}</p>
        <p className="text-xs text-gray-400 mt-1">
          {sermon.date && format(new Date(sermon.date), 'd MMM yyyy', { locale: es })}
        </p>
      </div>
    </motion.div>
  );
}