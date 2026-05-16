import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User as UserIcon, Camera, Bell, Shield, 
  Moon, LogOut, Check, ChevronRight, Sparkles,
  Circle, MapPin, Globe, Calendar, Mail,
  MessageSquare, Users, Image, Fingerprint,
  Zap, Settings2, Share2
} from 'lucide-react';
import { User } from '../types';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

export default function ProfileModal({ user, onClose, onUpdate }: ProfileModalProps) {
  const [activeTab, setActiveTab ] = useState<'overview' | 'edit' | 'privacy'>('overview');
  const [formData, setFormData] = useState<User>(user);
  const [isSaving, setIsSaving] = useState(false);

  const statuses = [
    { label: 'Online', value: 'online', color: 'bg-green-500' },
    { label: 'Away', value: 'away', color: 'bg-yellow-500' },
    { label: 'Busy', value: 'busy', color: 'bg-red-500' },
    { label: 'Offline', value: 'offline', color: 'bg-gray-500' },
  ];

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      onUpdate(formData);
      setIsSaving(false);
      onClose();
    }, 800);
  };

  const toggleSetting = (key: keyof NonNullable<User['settings']>) => {
    setFormData({
      ...formData,
      settings: {
        ...(formData.settings || { notifications: true, darkMode: false, readReceipts: true }),
        [key]: !formData.settings?.[key]
      }
    });
  };

  const changeAvatar = () => {
    const seeds = ['Felix', 'Aneka', 'Buddy', 'Max', 'Luna', 'Cleo', 'Oliver', 'Milo'];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)];
    setFormData({
      ...formData,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}_${Date.now()}`
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[700px] relative border border-gray-100 dark:border-gray-800"
      >
        {/* Header Section */}
        <div className="relative h-32 shrink-0 bg-gray-50 dark:bg-gray-800/50 overflow-hidden border-b border-gray-100 dark:border-gray-800">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-400 rounded-full blur-3xl" />
          </div>
          
          <div className="absolute top-6 right-6">
            <button 
              onClick={onClose}
              className="p-2 bg-gray-200/50 hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Header Overlay */}
        <div className="px-8 -mt-12 flex flex-col items-center md:items-start md:flex-row md:gap-6 relative z-10">
          <div className="relative group">
            <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white dark:border-gray-900 shadow-xl bg-white">
              <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={changeAvatar}
              className="absolute bottom-1 right-1 p-2 bg-black text-white rounded-xl shadow-lg hover:scale-110 transition-all border-2 border-white dark:border-gray-900"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 md:mt-14 text-center md:text-left flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
              <h1 className="text-2xl font-bold text-black dark:text-white truncate">{formData.username}</h1>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 self-center md:self-auto ${
                formData.status === 'online' ? 'bg-green-100 text-green-600 dark:bg-green-500/10' :
                formData.status === 'busy' ? 'bg-red-100 text-red-600 dark:bg-red-500/10' :
                'bg-gray-100 text-gray-600 dark:bg-gray-800'
              }`}>
                <Circle className="w-2 h-2 fill-current" />
                {formData.status}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{formData.bio}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8 mt-6 flex gap-6 border-b border-gray-100 dark:border-gray-800">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'edit', label: 'Edit' },
            { id: 'privacy', label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-semibold transition-all relative ${
                activeTab === tab.id 
                  ? 'text-blue-500' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTabProfile"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard icon={<MessageSquare />} label="Messages" value={formData.stats?.messagesSent || 0} />
                  <StatCard icon={<Users />} label="Groups" value={formData.stats?.groupsJoined || 0} />
                  <StatCard icon={<Image />} label="Files" value={formData.stats?.mediaShared || 0} />
                  <StatCard icon={<Calendar />} label="Joined" value={formData.joinedAt || '2024'} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Identity */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-3xl space-y-4">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Details</h3>
                    <div className="space-y-3">
                      <DetailRow icon={<Mail />} label="Email" value="pastorjohn046@gmail.com" />
                      <DetailRow icon={<MapPin />} label="Location" value={formData.location || 'San Francisco'} />
                      <DetailRow icon={<Globe />} label="Website" value={formData.website || 'aero.chat'} isLink />
                    </div>
                  </div>

                  {/* AI Card - Simplified */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-800/30 flex flex-col justify-between">
                    <div>
                      <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">AI Persona</h3>
                      <p className="text-lg font-bold text-black dark:text-white leading-tight">
                        Playing as <span className="text-blue-500">{formData.aiPersona || 'Identity Alpha'}</span>
                      </p>
                    </div>
                    <button className="mt-4 w-full py-2 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200 dark:shadow-none">
                      Change Persona
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'edit' && (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Display Name</label>
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 transition-all outline-none text-sm text-black dark:text-white font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Bio</label>
                    <input 
                      type="text" 
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 transition-all outline-none text-sm text-black dark:text-white font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Status</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {statuses.map((s) => (
                      <button 
                        key={s.value}
                        onClick={() => setFormData({...formData, status: s.value as any})}
                        className={`flex items-center justify-center gap-2 px-3 py-3 rounded-2xl border transition-all ${
                          formData.status === s.value 
                            ? 'bg-blue-50 border-blue-500 text-blue-600' 
                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        <Circle className={`w-2 h-2 fill-current ${s.color} ${formData.status === s.value ? '' : 'text-transparent opacity-0'}`} />
                        <span className="text-[11px] font-bold uppercase">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <SettingToggle 
                  icon={<Bell className="w-5 h-5" />} 
                  label="Push Notifications" 
                  isActive={!!formData.settings?.notifications}
                  onClick={() => toggleSetting('notifications')}
                />
                <SettingToggle 
                  icon={<Moon className="w-5 h-5" />} 
                  label="Black & White Mode" 
                  isActive={!!formData.settings?.darkMode}
                  onClick={() => toggleSetting('darkMode')}
                />
                <SettingToggle 
                  icon={<Shield className="w-5 h-5" />} 
                  label="Private Account" 
                  isActive={!!formData.settings?.readReceipts}
                  onClick={() => toggleSetting('readReceipts')}
                />
                
                <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-800/20 text-center">
                  <p className="text-sm font-semibold text-red-600 mb-4">Want to sign out from AeroChat?</p>
                  <button className="px-8 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200 dark:shadow-none flex items-center gap-2 mx-auto">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end items-center gap-3 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-md">
          <button 
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2.5 bg-blue-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Check className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl flex flex-col items-center justify-center text-center gap-1 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all">
      <div className="p-2 bg-blue-100 dark:bg-blue-500/10 text-blue-500 rounded-xl mb-1">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
      </div>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-black dark:text-white uppercase">{value}</p>
    </div>
  );
}

function DetailRow({ icon, label, value, isLink }: { icon: React.ReactNode, label: string, value: string, isLink?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-gray-400">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className={`text-xs font-semibold truncate ${isLink ? 'text-blue-500' : 'text-black dark:text-gray-300'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function SettingToggle({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
          {icon}
        </div>
        <span className="text-sm font-bold text-black dark:text-white">{label}</span>
      </div>
      <div className={`w-11 h-6 rounded-full transition-all relative p-1 ${isActive ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
        <motion.div 
          animate={{ x: isActive ? 20 : 0 }}
          className="w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </div>
    </button>
  );
}
