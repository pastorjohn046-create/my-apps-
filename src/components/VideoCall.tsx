import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, ShieldAlert, Sparkles, User as UserIcon, Upload, X, Check } from 'lucide-react';
import Peer from 'simple-peer';

interface VideoCallProps {
  chatName: string;
  onEnd: () => void;
  socket: any;
  chatId: string;
  isIncoming?: boolean;
  offerSignal?: any;
}

interface Persona {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
}

const DEFAULT_PERSONAS: Persona[] = [
  { id: 'p1', name: 'Identity Alpha', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop', type: 'image' },
  { id: 'p2', name: 'Cyber Rogue', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop', type: 'image' },
  { id: 'p3', name: 'Nexus AI', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop', type: 'image' },
];

export default function VideoCall({ chatName, onEnd, socket, chatId, isIncoming, offerSignal }: VideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isDeepFakeMode, setIsDeepFakeMode] = useState(false);
  const [isVoiceSync, setIsVoiceSync] = useState(true);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona>(DEFAULT_PERSONAS[0]);
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([]);
  const [bitrate, setBitrate] = useState(4520);
  
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setBitrate(prev => prev + Math.floor(Math.random() * 100 - 50));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const peer = new Peer({
          initiator: !isIncoming,
          trickle: false,
          stream: stream,
        });

        peer.on('signal', (data) => {
          if (!isIncoming) {
            socket.emit('call:init', { chatId, signal: data });
          } else {
            socket.emit('call:answer', { to: socket.id, signal: data });
          }
        });

        peer.on('stream', (remoteStream) => {
          setRemoteStream(remoteStream);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        });

        if (isIncoming && offerSignal) {
          peer.signal(offerSignal);
        }

        peerRef.current = peer;

        socket.on('call:answer', ({ signal }: any) => {
          peer.signal(signal);
        });
      } catch (err: any) {
        console.error("Failed to get media", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionError("Camera or Microphone permission was denied. Please allow access in your browser settings and refresh.");
        } else {
          setPermissionError("Could not access camera or microphone. Please ensure they are not being used by another application.");
        }
      }
    };

    initCall();

    return () => {
      localStream?.getTracks().forEach(t => t.stop());
      peerRef.current?.destroy();
    };
  }, []);

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !isMicOn;
      setIsMicOn(!isMicOn);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !isVideoOn;
      setIsVideoOn(!isVideoOn);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    const newPersona: Persona = {
      id: Date.now().toString(),
      name: 'Custom Asset',
      url,
      type
    };
    setCustomPersonas([newPersona, ...customPersonas]);
    setSelectedPersona(newPersona);
    setIsDeepFakeMode(true);
    setShowPersonaMenu(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center text-white overflow-hidden"
    >
      {/* Remote Video (Main) */}
      <div className="relative w-full h-full">
        {permissionError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-8 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border-2 border-red-500/50">
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Access Denied</h3>
            <p className="text-slate-400 max-w-sm mb-8">{permissionError}</p>
            <button 
              onClick={onEnd}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-bold transition-all"
            >
              Go Back
            </button>
          </div>
        ) : remoteStream ? (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
            <div className="w-40 h-40 bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse border-4 border-slate-700/50">
              <UserIcon className="w-20 h-20 text-slate-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Connecting to {chatName}...
            </p>
            <div className="flex items-center gap-2 mt-4 text-blue-400">
              <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
            </div>
          </div>
        )}

        {/* Local Video (Floating) */}
        <div className="absolute bottom-32 right-6 md:top-6 md:right-6 w-36 h-52 md:w-56 md:h-80 bg-slate-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-2 border-white/10 group z-20">
          <AnimatePresence mode="wait">
            {isDeepFakeMode ? (
              <motion.div 
                key="persona"
                initial={{ opacity: 0, scale: 1.1 }} 
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="w-full h-full relative"
              >
                {selectedPersona.type === 'video' ? (
                  <video 
                    src={selectedPersona.url} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover filter brightness-125 saturate-[1.2] contrast-[1.1]" 
                  />
                ) : (
                  <img 
                    src={selectedPersona.url} 
                    className="w-full h-full object-cover filter brightness-125 saturate-[1.2] contrast-[1.1]" 
                  />
                )}
                
                {/* AI HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none select-none">
                  {/* Facial Tracking Points Simulation */}
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-8 gap-0 opacity-40">
                    {[...Array(48)].map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.2, 0.5, 0.2]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: Math.random() * 2 + 1,
                          delay: Math.random() * 2
                        }}
                        className="flex items-center justify-center"
                      >
                        <div className="w-[1px] h-[1px] bg-blue-400 rounded-full" />
                      </motion.div>
                    ))}
                  </div>

                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-md border border-white/5">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[7px] font-black uppercase tracking-tighter text-white">DEEP_SYNC_v3.2</span>
                  </div>

                  <div className="absolute top-3 right-3 text-[7px] font-mono text-blue-400/80 text-right">
                    LATENCY: 12ms<br />
                    FPS: 60.0
                  </div>

                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center justify-end pb-4">
                    <motion.div 
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="bg-blue-600/60 backdrop-blur-md px-3 py-1 rounded-sm border border-blue-400/50 flex items-center gap-2"
                    >
                      <Sparkles className="w-2 h-2 text-white" />
                      <p className="text-[7px] font-black text-white uppercase tracking-[0.2em] leading-none">Synthesis Active</p>
                    </motion.div>
                  </div>
                </div>

                {/* Scanline & Vignette Effect */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.3)_100%)]" />
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px]" />
              </motion.div>
            ) : (
              <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full bg-slate-900">
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
                />
                {!isVideoOn && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <div className="relative">
                      <VideoOff className="w-10 h-10 text-slate-700" />
                      <div className="absolute inset-0 animate-pulse bg-slate-700/20 blur-xl rounded-full" />
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-4">Camera Off</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={() => setShowPersonaMenu(true)}
            className="absolute bottom-4 right-4 p-2.5 bg-black/40 hover:bg-blue-500 backdrop-blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 active:scale-95 shadow-lg border border-white/10"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Persona Selection Menu */}
        <AnimatePresence>
          {showPersonaMenu && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
              >
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight">AI Persona Engine</h3>
                      <p className="text-sm text-slate-400">Select source for DeepFake synthesis</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPersonaMenu(false)}
                    className="p-3 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 max-h-[60vh] scrollbar-hide">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Add Custom Trigger */}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-3xl border-2 border-dashed border-slate-800 hover:border-blue-500 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
                    >
                      <div className="p-4 bg-slate-800 rounded-2xl group-hover:bg-blue-500 transition-all duration-300 transform group-hover:rotate-12">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-white" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 group-hover:text-blue-400 uppercase tracking-[0.2em]">Upload Source</span>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept="image/*,video/*" 
                        className="hidden" 
                      />
                    </button>

                    {[...customPersonas, ...DEFAULT_PERSONAS].map((persona) => (
                      <button 
                        key={persona.id}
                        onClick={() => {
                          setSelectedPersona(persona);
                          setIsDeepFakeMode(true);
                          setShowPersonaMenu(false);
                        }}
                        className={`relative aspect-square rounded-3xl overflow-hidden border-2 transition-all duration-300 group ${selectedPersona.id === persona.id ? 'border-blue-500 scale-[0.98] shadow-2xl shadow-blue-500/20' : 'border-transparent hover:border-white/20'}`}
                      >
                        {persona.type === 'video' ? (
                          <video src={persona.url} className={`w-full h-full object-cover transition-all duration-500 ${selectedPersona.id === persona.id ? 'brightness-110 blur-none' : 'brightness-50 blur-[1px] group-hover:blur-none'}`} />
                        ) : (
                          <img src={persona.url} className={`w-full h-full object-cover transition-all duration-500 ${selectedPersona.id === persona.id ? 'brightness-110 blur-none' : 'brightness-50 blur-[1px] group-hover:blur-none'}`} />
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/100 via-transparent to-transparent opacity-60" />
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white truncate block">{persona.name}</span>
                        </div>

                        {selectedPersona.id === persona.id && (
                          <motion.div 
                            layoutId="check"
                            className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40"
                          >
                            <Check className="w-4 h-4 text-white stroke-[4px]" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="p-8 bg-black/40 backdrop-blur-3xl flex items-center justify-between">
                  <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black">MIL-SPEC ENCRYPTION ACTIVE</p>
                  <div className="flex gap-1.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-blue-500/20 rounded-full" />
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global DeepFake Status */}
        <AnimatePresence>
          {isDeepFakeMode && (
            <motion.div 
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-40 pointer-events-none"
            >
              <div className="bg-red-600/90 backdrop-blur-2xl px-6 py-2.5 rounded-[2rem] flex items-center gap-4 shadow-[0_0_50px_rgba(220,38,38,0.3)] border border-white/10">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping absolute inset-0" />
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-white" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Digital Persona Stream Live</span>
                </div>
              </div>

              {/* System Log Ticker */}
              <div className="flex flex-col items-center gap-1 opacity-60">
                <p className="text-[7px] font-mono text-white/80 uppercase tracking-widest animate-pulse">
                  NEURAL_LINK_STABLE // SYNC_LOCK: {Math.floor(Math.random() * 100) + 900}ms
                </p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      className="w-4 h-[1px] bg-white/40"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Panel */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-8 px-8 py-6 bg-slate-900/80 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.6)] z-50">
        <button 
          onClick={toggleMic}
          className={`group flex flex-col items-center gap-2 p-3 transition-all ${isMicOn ? 'text-slate-400 hover:text-blue-400' : 'text-red-500'}`}
        >
          <div className={`p-4 rounded-full transition-all ${isMicOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500/10 border-2 border-red-500/50'}`}>
            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">{isMicOn ? 'Mute' : 'Unmute'}</span>
        </button>

        <button 
          onClick={toggleVideo}
          className={`group flex flex-col items-center gap-2 p-3 transition-all ${isVideoOn ? 'text-slate-400 hover:text-blue-400' : 'text-red-500'}`}
        >
          <div className={`p-4 rounded-full transition-all ${isVideoOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500/10 border-2 border-red-500/50'}`}>
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">{isVideoOn ? 'Cam Off' : 'Cam On'}</span>
        </button>

        <div className="w-[1px] h-12 bg-white/10 mx-2" />

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowPersonaMenu(true)}
            className={`relative group flex flex-col items-center gap-2 p-3 transition-all ${isDeepFakeMode ? 'text-blue-400' : 'text-slate-400 hover:text-blue-400'}`}
          >
            <div className={`p-5 rounded-3xl transition-all duration-500 ${isDeepFakeMode ? 'bg-blue-500 text-white shadow-2xl shadow-blue-500/50 transform scale-110 animate-pulse-slow' : 'bg-slate-800 hover:bg-slate-700'}`}>
              <Sparkles className={`w-8 h-8 ${isDeepFakeMode ? 'animate-spin-slow' : ''}`} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">{isDeepFakeMode ? 'Switch Alias' : 'Live Alias'}</span>
          </button>

          {isDeepFakeMode && (
            <button 
              onClick={() => setIsVoiceSync(!isVoiceSync)}
              className={`flex flex-col items-center gap-2 p-3 transition-all ${isVoiceSync ? 'text-blue-400' : 'text-slate-500'}`}
            >
              <div className={`p-4 rounded-full transition-all ${isVoiceSync ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-slate-800'}`}>
                <Mic className="w-6 h-6" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">Voice Sync</span>
            </button>
          )}
        </div>

        {isDeepFakeMode && (
          <button 
            onClick={() => setIsDeepFakeMode(false)}
            className="flex flex-col items-center gap-2 p-3 text-slate-400 hover:text-white transition-all"
          >
            <div className="p-4 rounded-full bg-slate-800 hover:bg-slate-700">
              <Check className="w-6 h-6" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">Go Real</span>
          </button>
        )}

        <button 
          onClick={onEnd}
          className="group flex flex-col items-center gap-2 p-3"
        >
          <div className="p-5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-2xl shadow-red-600/30 transform hover:scale-110 active:scale-90 transition-all duration-300">
            <PhoneOff className="w-8 h-8" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest text-red-500">Hang Up</span>
        </button>
      </div>
    </motion.div>
  );
}
