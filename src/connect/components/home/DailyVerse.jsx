import React from 'react';
import { BookOpen, Share2, Heart } from 'lucide-react';
import { Button } from '@connect/components/ui/button';
import { motion } from 'framer-motion';

const dailyVerses = [
{ text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.", reference: "Juan 3:16" },
{ text: "Todo lo puedo en Cristo que me fortalece.", reference: "Filipenses 4:13" },
{ text: "Confía en Jehová con todo tu corazón, y no te apoyes en tu propia prudencia.", reference: "Proverbios 3:5" },
{ text: "El Señor es mi pastor, nada me faltará.", reference: "Salmos 23:1" },
{ text: "Yo soy el camino, la verdad y la vida; nadie viene al Padre sino por mí.", reference: "Juan 14:6" },
{ text: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.", reference: "Jeremías 29:11" },
{ text: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios.", reference: "Isaías 41:10" }];


export default function DailyVerse() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const verse = dailyVerses[dayOfYear % dailyVerses.length];

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Versículo del día',
        text: `"${verse.text}" - ${verse.reference}`
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }} className="bg-slate-200 p-6 rounded-2xl from-amber-50 to-orange-50 border border-amber-100">


      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-2 rounded-lg">
            <BookOpen className="w-4 h-4 text-amber-700" />
          </div>
          <span className="text-sm font-medium text-amber-800">Versículo del Día</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
          onClick={handleShare}>

          <Share2 className="w-4 h-4" />
        </Button>
      </div>
      
      <blockquote className="text-gray-700 leading-relaxed mb-3 italic">
        "{verse.text}"
      </blockquote>
      
      <p className="text-right text-sm font-semibold text-amber-700">
        — {verse.reference}
      </p>
    </motion.div>);

}