import React from 'react';
import { Link } from '@connect/lib/router-compat';
import { createPageUrl } from '@connect/utils';
import { 
  HandHeart, 
  BookOpen, 
  Radio, 
  Calendar,
  Heart,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';

const actions = [
  { icon: HandHeart, label: 'Orar', href: 'Prayer', color: 'bg-red-50 text-red-600' },
  { icon: BookOpen, label: 'Biblia', href: 'Bible', color: 'bg-blue-50 text-blue-600' },
  { icon: Play, label: 'En Vivo', href: 'Live', color: 'bg-purple-50 text-purple-600' },
  { icon: Radio, label: 'Radio', href: 'Radio', color: 'bg-green-50 text-green-600' },
  { icon: Calendar, label: 'Eventos', href: 'Events', color: 'bg-amber-50 text-amber-600' },
  { icon: Heart, label: 'Dar', href: 'Give', color: 'bg-pink-50 text-pink-600' },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action, index) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <Link 
            to={createPageUrl(action.href)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-105"
          >
            <div className={`p-3 rounded-xl ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-700">{action.label}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}