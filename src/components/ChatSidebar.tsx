import React from 'react';
import { Search, Menu, Check, CheckCheck, Settings } from 'lucide-react';
import { Chat, User } from '../types';

interface SidebarProps {
  chats: Chat[];
  currentUser: User;
  activeChatId?: string;
  onSelectChat: (id: string) => void;
  onOpenProfile: () => void;
}

export default function ChatSidebar({ chats, currentUser, activeChatId, onSelectChat, onOpenProfile }: SidebarProps) {
  return (
    <div className="w-full md:w-80 h-full border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4 flex items-center gap-3">
        <button 
          onClick={onOpenProfile}
          className="relative group shrink-0"
        >
          <img src={currentUser.avatar} alt="My Profile" className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-blue-400 transition-all shadow-sm" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
            <div className={`w-2 h-2 rounded-full ${currentUser.status === 'busy' ? 'bg-red-500' : currentUser.status === 'away' ? 'bg-yellow-500' : 'bg-green-500'}`} />
          </div>
        </button>
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 text-sm text-black focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          />
        </div>
        <button 
          onClick={onOpenProfile}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full p-3 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${activeChatId === chat.id ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
          >
            <div className="relative">
              <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold text-black truncate">{chat.name}</h3>
                <span className="text-xs text-gray-400">12:00 PM</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-500 truncate">{chat.lastMessage || 'No messages yet'}</p>
                {chat.unreadCount ? (
                  <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center">
                    {chat.unreadCount}
                  </span>
                ) : (
                   <CheckCheck className="w-4 h-4 text-blue-500" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
