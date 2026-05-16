import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Message } from '../types';
import { CheckCheck, Play, Pause } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex w-full mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm relative ${
          isOwn 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-white text-black rounded-bl-none border border-gray-100'
        }`}
      >
        {!isOwn && (
          <p className="text-[10px] font-bold text-blue-500 mb-1">{message.sender}</p>
        )}

        {message.type === 'sticker' ? (
          <div className="py-1">
            <img 
              src={message.mediaUrl} 
              alt="Sticker" 
              className="w-32 h-32 object-contain"
            />
          </div>
        ) : message.type === 'audio' ? (
          <div className="flex items-center gap-3 py-1 pr-2 min-w-[200px]">
            <button 
              onClick={togglePlay}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isOwn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
            </button>
            
            <div className="flex-1">
              {/* Waveform Visualization */}
              <div className="flex items-center gap-0.5 h-6 mb-1">
                {[...Array(24)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-[2px] rounded-full transition-all ${
                      currentTime / (message.duration || 1) > i / 24 
                        ? (isOwn ? 'bg-white' : 'bg-blue-500') 
                        : (isOwn ? 'bg-white/30' : 'bg-gray-200')
                    }`}
                    style={{ height: `${Math.random() * 100}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center px-0.5">
                <span className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                  {formatTime(currentTime)} / {formatTime(message.duration || 0)}
                </span>
              </div>
            </div>
            <audio ref={audioRef} src={message.mediaUrl} />
          </div>
        ) : message.type === 'image' ? (
          <div className="rounded-lg overflow-hidden my-1">
            <img 
              src={message.mediaUrl} 
              alt="Sent picture" 
              className="max-w-full max-h-80 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.mediaUrl, '_blank')}
            />
            {message.content && message.content !== '[Image Message]' && (
              <p className="text-[15px] leading-relaxed mt-2">{message.content}</p>
            )}
          </div>
        ) : (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}

        <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
          <span className="text-[10px] opacity-80">
            {new Date(message.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && <CheckCheck className="w-3 h-3" />}
        </div>
      </div>
    </motion.div>
  );
}

export default MessageBubble;
