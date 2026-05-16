import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SmartRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
  isLoading: boolean;
}

export default function SmartReplies({ replies, onSelect, isLoading }: SmartRepliesProps) {
  if (!isLoading && replies.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4">
      <AnimatePresence mode="popLayout">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full"
          >
            <Sparkles className="w-3 h-3 text-blue-500 animate-pulse" />
            <span className="text-xs text-gray-400">Suggesting...</span>
          </motion.div>
        ) : (
          replies.map((reply, i) => (
            <motion.button
              key={reply}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(reply)}
              className="whitespace-nowrap bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 px-4 py-1.5 rounded-full text-xs text-gray-600 transition-all flex items-center gap-1.5 shadow-sm"
            >
              {reply}
            </motion.button>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
