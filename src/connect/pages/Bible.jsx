"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@connect/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BookOpen, 
  Search, 
  Heart, 
  ChevronLeft, 
  ChevronRight,
  X,
  Bookmark,
  Share2,
  Star
} from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { Input } from '@connect/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@connect/components/ui/dialog';
import { ScrollArea } from '@connect/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@connect/components/ui/tabs';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Bible books structure (Spanish Reina Valera)
const bibleBooks = {
  old: [
    { name: 'Génesis', chapters: 50 },
    { name: 'Éxodo', chapters: 40 },
    { name: 'Levítico', chapters: 27 },
    { name: 'Números', chapters: 36 },
    { name: 'Deuteronomio', chapters: 34 },
    { name: 'Josué', chapters: 24 },
    { name: 'Jueces', chapters: 21 },
    { name: 'Rut', chapters: 4 },
    { name: '1 Samuel', chapters: 31 },
    { name: '2 Samuel', chapters: 24 },
    { name: '1 Reyes', chapters: 22 },
    { name: '2 Reyes', chapters: 25 },
    { name: '1 Crónicas', chapters: 29 },
    { name: '2 Crónicas', chapters: 36 },
    { name: 'Esdras', chapters: 10 },
    { name: 'Nehemías', chapters: 13 },
    { name: 'Ester', chapters: 10 },
    { name: 'Job', chapters: 42 },
    { name: 'Salmos', chapters: 150 },
    { name: 'Proverbios', chapters: 31 },
    { name: 'Eclesiastés', chapters: 12 },
    { name: 'Cantares', chapters: 8 },
    { name: 'Isaías', chapters: 66 },
    { name: 'Jeremías', chapters: 52 },
    { name: 'Lamentaciones', chapters: 5 },
    { name: 'Ezequiel', chapters: 48 },
    { name: 'Daniel', chapters: 12 },
    { name: 'Oseas', chapters: 14 },
    { name: 'Joel', chapters: 3 },
    { name: 'Amós', chapters: 9 },
    { name: 'Abdías', chapters: 1 },
    { name: 'Jonás', chapters: 4 },
    { name: 'Miqueas', chapters: 7 },
    { name: 'Nahúm', chapters: 3 },
    { name: 'Habacuc', chapters: 3 },
    { name: 'Sofonías', chapters: 3 },
    { name: 'Hageo', chapters: 2 },
    { name: 'Zacarías', chapters: 14 },
    { name: 'Malaquías', chapters: 4 },
  ],
  new: [
    { name: 'Mateo', chapters: 28 },
    { name: 'Marcos', chapters: 16 },
    { name: 'Lucas', chapters: 24 },
    { name: 'Juan', chapters: 21 },
    { name: 'Hechos', chapters: 28 },
    { name: 'Romanos', chapters: 16 },
    { name: '1 Corintios', chapters: 16 },
    { name: '2 Corintios', chapters: 13 },
    { name: 'Gálatas', chapters: 6 },
    { name: 'Efesios', chapters: 6 },
    { name: 'Filipenses', chapters: 4 },
    { name: 'Colosenses', chapters: 4 },
    { name: '1 Tesalonicenses', chapters: 5 },
    { name: '2 Tesalonicenses', chapters: 3 },
    { name: '1 Timoteo', chapters: 6 },
    { name: '2 Timoteo', chapters: 4 },
    { name: 'Tito', chapters: 3 },
    { name: 'Filemón', chapters: 1 },
    { name: 'Hebreos', chapters: 13 },
    { name: 'Santiago', chapters: 5 },
    { name: '1 Pedro', chapters: 5 },
    { name: '2 Pedro', chapters: 3 },
    { name: '1 Juan', chapters: 5 },
    { name: '2 Juan', chapters: 1 },
    { name: '3 Juan', chapters: 1 },
    { name: 'Judas', chapters: 1 },
    { name: 'Apocalipsis', chapters: 22 },
  ]
};

export default function Bible() {
  const [view, setView] = useState('books'); // books, chapters, reading
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [chapterContent, setChapterContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const { data: favorites = [] } = useQuery({
    queryKey: ['bibleFavorites'],
    queryFn: () => api.entities.BibleFavorite.list('-created_date'),
    enabled: !!user,
  });

  const saveFavoriteMutation = useMutation({
    mutationFn: (data) => api.entities.BibleFavorite.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bibleFavorites'] });
      toast.success('Versículo guardado');
    },
  });

  const loadChapter = async (book, chapter) => {
    setLoading(true);
    try {
      // bible-api.com — libre, sin API key, RVR1960 en español
      const res = await fetch(
        `https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=rvr1960`
      );
      if (!res.ok) throw new Error('Bible API error');
      const bibleData = await res.json();
      const verses = (bibleData.verses || []).map(v => ({ verse: v.verse, text: v.text.trim() }));
      setChapterContent(verses);
      setView('reading');
    } catch (error) {
      toast.error('Error al cargar el capítulo');
    }
    setLoading(false);
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setView('chapters');
  };

  const handleSelectChapter = (chapter) => {
    setSelectedChapter(chapter);
    loadChapter(selectedBook.name, chapter);
  };

  const handleSaveVerse = (verse) => {
    if (!user) {
      toast.error('Inicia sesión para guardar versículos');
      return;
    }
    saveFavoriteMutation.mutate({
      book: selectedBook.name,
      chapter: selectedChapter,
      verse: verse.verse,
      text: verse.text,
    });
  };

  const goToPreviousChapter = () => {
    if (selectedChapter > 1) {
      handleSelectChapter(selectedChapter - 1);
    }
  };

  const goToNextChapter = () => {
    if (selectedChapter < selectedBook.chapters) {
      handleSelectChapter(selectedChapter + 1);
    }
  };

  const allBooks = [...bibleBooks.old, ...bibleBooks.new];
  const filteredBooks = searchQuery 
    ? allBooks.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {view !== 'books' && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setView(view === 'reading' ? 'chapters' : 'books')}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <BookOpen className="w-5 h-5 text-red-600" />
            <h1 className="font-bold text-lg">
              {view === 'books' && 'Biblia'}
              {view === 'chapters' && selectedBook?.name}
              {view === 'reading' && `${selectedBook?.name} ${selectedChapter}`}
            </h1>
          </div>
          {user && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowFavorites(true)}
              className="text-amber-500"
            >
              <Star className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Book Selection */}
      {view === 'books' && (
        <div className="p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar libro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredBooks ? (
            <div className="grid grid-cols-2 gap-2">
              {filteredBooks.map((book) => (
                <Button
                  key={book.name}
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => handleSelectBook(book)}
                >
                  {book.name}
                </Button>
              ))}
            </div>
          ) : (
            <Tabs defaultValue="old" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="old">Antiguo Testamento</TabsTrigger>
                <TabsTrigger value="new">Nuevo Testamento</TabsTrigger>
              </TabsList>
              
              <TabsContent value="old">
                <div className="grid grid-cols-2 gap-2">
                  {bibleBooks.old.map((book) => (
                    <Button
                      key={book.name}
                      variant="outline"
                      className="justify-start h-auto py-3 text-sm"
                      onClick={() => handleSelectBook(book)}
                    >
                      {book.name}
                    </Button>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="new">
                <div className="grid grid-cols-2 gap-2">
                  {bibleBooks.new.map((book) => (
                    <Button
                      key={book.name}
                      variant="outline"
                      className="justify-start h-auto py-3 text-sm"
                      onClick={() => handleSelectBook(book)}
                    >
                      {book.name}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}

      {/* Chapter Selection */}
      {view === 'chapters' && selectedBook && (
        <div className="p-4">
          <p className="text-gray-500 text-sm mb-4">Selecciona un capítulo</p>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => (
              <Button
                key={chapter}
                variant="outline"
                className="aspect-square text-lg font-medium"
                onClick={() => handleSelectChapter(chapter)}
              >
                {chapter}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Reading View */}
      {view === 'reading' && (
        <div className="flex flex-col h-[calc(100vh-120px)]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Cargando capítulo...</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 px-4 py-6">
              <div className="max-w-lg mx-auto space-y-4">
                {chapterContent.map((verse) => (
                  <motion.div
                    key={verse.verse}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group relative"
                  >
                    <p className="text-gray-800 leading-relaxed">
                      <span className="text-red-600 font-bold mr-2 text-sm">{verse.verse}</span>
                      {verse.text}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleSaveVerse(verse)}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Navigation */}
          <div className="border-t p-4 flex items-center justify-between bg-white">
            <Button
              variant="outline"
              onClick={goToPreviousChapter}
              disabled={selectedChapter <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            <span className="text-sm text-gray-500">
              Capítulo {selectedChapter} de {selectedBook?.chapters}
            </span>
            <Button
              variant="outline"
              onClick={goToNextChapter}
              disabled={selectedChapter >= selectedBook?.chapters}
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Favorites Dialog */}
      <Dialog open={showFavorites} onOpenChange={setShowFavorites}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Mis Versículos Favoritos
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            {favorites.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No tienes versículos guardados
              </p>
            ) : (
              <div className="space-y-4">
                {favorites.map((fav) => (
                  <div key={fav.id} className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-gray-800 text-sm leading-relaxed">
                      "{fav.text}"
                    </p>
                    <p className="text-amber-700 font-medium text-sm mt-2">
                      — {fav.book} {fav.chapter}:{fav.verse}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}