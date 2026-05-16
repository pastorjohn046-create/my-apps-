/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Phone, Video, MoreVertical, Paperclip, Smile, ArrowLeft, Plus, Mic, PhoneOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, Chat, User } from './types';
import ChatSidebar from './components/ChatSidebar';
import MessageBubble from './components/MessageBubble';
import SmartReplies from './components/SmartReplies';
import VoiceRecorder from './components/VoiceRecorder';
import ProfileModal from './components/ProfileModal';
import StickerPicker from './components/StickerPicker';

const DEFAULT_USER: User = {
  id: 'user_1',
  username: 'John Doe',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  bio: 'Product Designer & Aero enthusiast. Always online!',
  location: 'San Francisco, CA',
  website: 'https://aero.chat',
  joinedAt: 'May 2024',
  status: 'online',
  settings: {
    notifications: true,
    darkMode: false,
    readReceipts: true
  },
  stats: {
    messagesSent: 1284,
    groupsJoined: 12,
    mediaShared: 45
  }
};

import VideoCall from './components/VideoCall';

const INITIAL_CHATS: Chat[] = [
  { id: 'chat_1', name: 'Design Team', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=Design', lastMessage: 'See you tomorrow!', unreadCount: 2 },
  { id: 'chat_2', name: 'Alice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', lastMessage: 'Hey, how is it going?', unreadCount: 0 },
  { id: 'chat_3', name: 'Family Group', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=Family', lastMessage: 'Lunch at 1?', unreadCount: 5 },
  { id: 'chat_4', name: 'News Channel', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=News', lastMessage: 'Breaking: Major discovery...', unreadCount: 12 },
];

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [incomingCall, setIncomingCall] = useState<{ from: string, signal: any } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('message', (msg: Message) => {
      setMessages((prev) => {
        const next = [...prev, msg];
        // Trigger AI suggestions if message is not from current user
        if (msg.sender !== currentUser.username) {
          getAISuggestions(next, msg.content);
        }
        return next;
      });
    });

    newSocket.on('history', (history: Message[]) => {
      setMessages(history);
    });

    newSocket.on('call:offer', ({ from, signal }: any) => {
      setIncomingCall({ from, signal });
    });

    return () => {
      newSocket.close();
    };
  }, []); // Remove activeChat from dependency to prevent re-connecting on every chat select

  useEffect(() => {
    if (activeChat && socket) {
      socket.emit('join', activeChat.id);
    }
  }, [activeChat, socket]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getAISuggestions = async (history: Message[], latestMessage: string) => {
    setIsSuggesting(true);
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageHistory: history, currentMessage: latestMessage }),
      });
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSend = (content?: string) => {
    const text = content || input;
    if (!text.trim() || !socket || !activeChat) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: currentUser.username,
      content: text,
      timestamp: new Date().toISOString(),
      chatId: activeChat.id,
      type: 'text'
    };

    socket.emit('message', newMessage);
    setInput('');
    setSuggestions([]);
  };

  const handleSendSticker = (url: string) => {
    if (!socket || !activeChat) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: currentUser.username,
      content: '[Sticker]',
      timestamp: new Date().toISOString(),
      chatId: activeChat.id,
      type: 'sticker',
      mediaUrl: url
    };

    socket.emit('message', newMessage);
    setIsStickerPickerOpen(false);
  };

  const handleSendVoice = async (blob: Blob, duration: number) => {
    if (!socket || !activeChat) return;

    const formData = new FormData();
    formData.append('audio', blob, 'voice.webm');

    try {
      const uploadRes = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData
      });
      const { url } = await uploadRes.json();

      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: currentUser.username,
        content: '[Audio Message]',
        timestamp: new Date().toISOString(),
        chatId: activeChat.id,
        type: 'audio',
        duration,
        mediaUrl: url
      };

      socket.emit('message', newMessage);
      setIsRecording(false);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket || !activeChat) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const { url } = await uploadRes.json();

      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: currentUser.username,
        content: '[Image Message]',
        timestamp: new Date().toISOString(),
        chatId: activeChat.id,
        type: 'image',
        mediaUrl: url
      };

      socket.emit('message', newMessage);
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans relative">
      <AnimatePresence mode="wait">
        {/* Sidebar */}
        {(!activeChat || window.innerWidth >= 768) && (
          <motion.div 
            key="sidebar"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`h-full border-r border-gray-200 bg-white z-20 ${activeChat ? 'hidden md:flex w-80' : 'w-full md:w-80'}`}
          >
            <ChatSidebar 
              chats={INITIAL_CHATS} 
              currentUser={currentUser}
              activeChatId={activeChat?.id} 
              onSelectChat={(id) => setActiveChat(INITIAL_CHATS.find((c) => c.id === id) || null)} 
              onOpenProfile={() => setIsProfileOpen(true)}
            />
            {/* FAB for new chat on mobile */}
            {!activeChat && (
              <button className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-30">
                <Plus className="w-6 h-6" />
              </button>
            )}
          </motion.div>
        )}

        {/* Main Chat Area */}
        {(activeChat || window.innerWidth >= 768) && (
          <motion.div 
            key="chat"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`flex-1 flex flex-col h-full bg-gray-50 z-10 ${!activeChat ? 'hidden md:flex items-center justify-center' : 'flex w-full'}`}
          >
            {activeChat ? (
              <>
                {/* Chat Header */}
                <header className="h-16 md:h-18 px-4 border-b border-gray-200 bg-white/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
                  <div className="flex items-center gap-2 md:gap-4">
                    <button 
                      onClick={() => setActiveChat(null)} 
                      className="md:hidden p-3 -ml-2 hover:bg-gray-100 rounded-full active:bg-gray-200 transition-colors"
                    >
                      <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <div className="relative">
                      <img src={activeChat.avatar} alt={activeChat.name} className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover shadow-sm" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-gray-900 truncate leading-tight">{activeChat.name}</h2>
                      <p className="text-[11px] md:text-xs text-green-500 font-semibold uppercase tracking-wider">online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 text-gray-500">
                <button className="p-2.5 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
                  <Phone className="w-5 h-5 text-blue-500" />
                </button>
                <button 
                  onClick={() => setIsCalling(true)}
                  className="p-2.5 hover:bg-gray-100 rounded-full transition-colors hidden sm:block"
                >
                  <Video className="w-5 h-5 text-blue-500" />
                </button>
                    <button className="p-2.5 hover:bg-gray-100 rounded-full transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </header>

                {/* Messages Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#e5ddd5] bg-[url('https://wallpaperaccess.com/full/1288290.jpg')] bg-repeat bg-center">
                  <div className="max-w-4xl mx-auto space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        <MessageBubble 
                          message={msg} 
                          isOwn={msg.sender === currentUser.username} 
                        />
                      </div>
                    ))}
                    <div ref={scrollRef} className="h-4" />
                  </div>
                </main>

                {/* Input Area */}
                <footer className="bg-white/95 backdrop-blur-md border-t border-gray-100 p-3 md:p-4 safe-bottom">
                  <div className="max-w-4xl mx-auto flex flex-col gap-3">
                    <SmartReplies 
                      replies={suggestions} 
                      onSelect={(reply) => handleSend(reply)} 
                      isLoading={isSuggesting} 
                    />
                    
                    <div className="flex items-center gap-2 md:gap-3">
                      {isRecording ? (
                        <VoiceRecorder 
                          onSend={handleSendVoice}
                          onCancel={() => setIsRecording(false)}
                        />
                      ) : (
                        <>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 text-gray-400 hover:text-blue-500 active:scale-90 transition-all rounded-full hover:bg-blue-50"
                          >
                            <Paperclip className="w-6 h-6" />
                          </button>
                          <div className="flex-1 bg-gray-100 rounded-2xl flex items-center p-1.5 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-400 focus-within:shadow-sm">
                            <textarea 
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSend();
                                }
                              }}
                              placeholder="Write a message..."
                              className="flex-1 bg-transparent border-none outline-none text-black text-[15px] md:text-sm resize-none max-h-32 px-3 py-1.5 scrollbar-hide placeholder:text-gray-500"
                              rows={1}
                            />
                            <div className="relative">
                              <button 
                                onClick={() => setIsStickerPickerOpen(!isStickerPickerOpen)}
                                className={`p-2 rounded-full transition-colors ${isStickerPickerOpen ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-blue-500'}`}
                              >
                                <Smile className="w-6 h-6" />
                              </button>
                              <AnimatePresence>
                                {isStickerPickerOpen && (
                                  <StickerPicker 
                                    onSelect={handleSendSticker} 
                                    onClose={() => setIsStickerPickerOpen(false)} 
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                          {input.trim() ? (
                            <button 
                              onClick={() => handleSend()}
                              className="p-3.5 rounded-full transition-all flex-shrink-0 bg-blue-500 text-white shadow-lg active:scale-95 shadow-blue-200"
                            >
                              <Send className="w-6 h-6" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => setIsRecording(true)}
                              className="p-3.5 rounded-full transition-all flex-shrink-0 bg-gray-100 text-gray-400 hover:text-blue-500 hover:bg-blue-50 active:scale-95"
                            >
                              <Mic className="w-6 h-6" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </footer>
              </>
            ) : (
              <div className="text-center p-10 bg-white/60 backdrop-blur-lg rounded-[2.5rem] border border-white/50 shadow-2xl flex flex-col items-center max-w-sm mx-auto">
                <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-blue-400 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-blue-100">
                  <Send className="w-10 h-10 text-white -rotate-12 translate-x-1" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Welcome to AeroChat</h2>
                <p className="text-gray-500 leading-relaxed">Select a conversation from the sidebar to start messaging with your team and friends.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProfileOpen && (
          <ProfileModal 
            user={currentUser}
            onClose={() => setIsProfileOpen(false)}
            onUpdate={(u) => setCurrentUser(u)}
          />
        )}
        
        {isCalling && activeChat && (
          <VideoCall 
            chatName={activeChat.name}
            chatId={activeChat.id}
            socket={socket}
            onEnd={() => {
              setIsCalling(false);
              setIncomingCall(null);
            }}
            isIncoming={!!incomingCall}
            offerSignal={incomingCall?.signal}
          />
        )}

        {incomingCall && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-white rounded-2xl shadow-2xl p-4 border border-gray-100 flex items-center gap-4 min-w-[280px]"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Video className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Incoming Call</p>
              <p className="text-xs text-gray-500">Someone is calling you...</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIncomingCall(null)}
                className="p-2 bg-red-100 text-red-500 rounded-full hover:bg-red-200"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  setIsCalling(true);
                  // Signaling happens inside VideoCall
                }}
                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-md"
              >
                <Phone className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

  );
}

