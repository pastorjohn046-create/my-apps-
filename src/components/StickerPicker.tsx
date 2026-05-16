import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface StickerPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

const STICKERS = [
  { id: '1', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker1' },
  { id: '2', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker2' },
  { id: '3', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker3' },
  { id: '4', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker4' },
  { id: '5', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker5' },
  { id: '6', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker6' },
  { id: '7', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker7' },
  { id: '8', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker8' },
  { id: '9', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker9' },
  { id: '10', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker10' },
  { id: '11', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker11' },
  { id: '12', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker12' },
];

export default function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute bottom-20 right-0 w-72 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 z-50"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest pl-1">Stickers</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto scrollbar-hide">
        {STICKERS.map((sticker) => (
          <button
            key={sticker.id}
            onClick={() => {
              onSelect(sticker.url);
              onClose();
            }}
            className="group relative aspect-square bg-gray-50 dark:bg-gray-800 rounded-2xl p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95"
          >
            <img 
              src={sticker.url} 
              alt="Sticker" 
              className="w-full h-full object-contain group-hover:rotate-6 transition-transform" 
            />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
