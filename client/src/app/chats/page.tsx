'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useGameStore } from '../../store/useGameStore';
import { api } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Send, 
  Mic, 
  Smile, 
  Video, 
  ArrowLeft, 
  Gamepad2, 
  PhoneOff, 
  VideoOff, 
  Volume2, 
  VolumeX, 
  Camera,
  Play, 
  Pause, 
  MessageSquare,
  Users,
  UserPlus,
  Clock,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Voice Message Audio Bubble Component
const VoicePlayBubble: React.FC<{ url: string; duration: number }> = ({ url, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error('Playback failed', e));
      setIsPlaying(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3.5 py-1 px-1">
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
      </button>
      <div className="flex flex-col flex-1 gap-1 min-w-[130px]">
        {/* Simple visual waveform progressbar */}
        <div className="w-full bg-white/15 h-1.5 rounded-full relative overflow-hidden">
          <div 
            className="bg-emerald-400 h-full transition-all duration-100" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <div className="flex justify-between items-center text-[9px] text-gray-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default function ChatsPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const { 
    connectSocket, 
    socket, 
    isConnected, 
    setUnreadPrivateCount, 
    setActiveChatPartnerId 
  } = useGameStore();

  const [mounted, setMounted] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'explore'>('friends');
  
  // Conversations loaded from backend API
  const [partners, setPartners] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Record<string, any[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const [messageText, setMessageText] = useState('');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  // Voice note recording states
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC / Video calling states
  const [activeCall, setActiveCall] = useState<{
    status: 'idle' | 'calling' | 'incoming' | 'connected';
    peerId: string;
    peerUsername: string;
    peerAvatar: string;
    isAudioMuted: boolean;
    isVideoMuted: boolean;
  } | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Audio Context for Ringing Sound
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringerGainRef = useRef<GainNode | null>(null);
  const callIntervalRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/auth');
    } else if (token) {
      connectSocket(token);
    }
  }, [isAuthenticated, token, router, connectSocket, mounted]);

  // Fetch all conversations from backend on mount
  const fetchConversations = async () => {
    try {
      const data = await api.chats.getConversations();
      setPartners(data);

      // Recalculate total unread badge count
      const totalUnreads = data.reduce((acc, p) => acc + (p.unreadCount || 0), 0);
      setUnreadPrivateCount(totalUnreads);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  useEffect(() => {
    if (mounted && isAuthenticated) {
      fetchConversations();
    }
  }, [mounted, isAuthenticated]);

  // Scroll to bottom when conversation messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeUserId]);

  // Sync active partner globally in the game store to control unread increments
  useEffect(() => {
    setActiveChatPartnerId(activeUserId);
    return () => {
      setActiveChatPartnerId(null);
    };
  }, [activeUserId, setActiveChatPartnerId]);

  // Handle socket events for private messaging and signaling
  useEffect(() => {
    if (socket && isConnected) {
      // Listen to incoming private messages
      const handlePrivateMsg = (msg: any) => {
        const partnerId = msg.fromUserId === user?.id ? msg.toUserId : msg.fromUserId;
        
        setConversations(prev => {
          const list = prev[partnerId] || [];
          if (list.some(m => m.id === msg.id)) return prev;
          return {
            ...prev,
            [partnerId]: [...list, msg]
          };
        });

        // Update partners list details (last message, unread status)
        setPartners(prev => {
          const updated = prev.map(p => {
            if (p._id === partnerId) {
              const isCurrentChat = partnerId === activeUserId;
              return {
                ...p,
                lastMessage: msg,
                unreadCount: isCurrentChat ? 0 : (p.unreadCount || 0) + 1
              };
            }
            return p;
          });

          // Sort conversations with the most recent message first
          updated.sort((a, b) => {
            const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp || a.lastMessage.createdAt).getTime() : 0;
            const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp || b.lastMessage.createdAt).getTime() : 0;
            return timeB - timeA;
          });

          // Re-update total global unreads
          const totalUnreads = updated.reduce((acc, p) => acc + (p.unreadCount || 0), 0);
          setUnreadPrivateCount(totalUnreads);

          return updated;
        });

        // If viewing this chat now, mark it as read on the backend
        if (partnerId === activeUserId) {
          api.chats.markAsRead(partnerId).catch(console.error);
        }
      };

      // Listen to partner typing indicators
      const handlePrivateTyping = ({ fromUserId, isTyping }: any) => {
        setTypingUsers(prev => ({
          ...prev,
          [fromUserId]: isTyping
        }));
      };

      // Listen to incoming WebRTC calls
      const handleIncomingCall = ({ fromUserId, fromUsername, fromAvatar, offer }: any) => {
        setActiveCall({
          status: 'incoming',
          peerId: fromUserId,
          peerUsername: fromUsername,
          peerAvatar: fromAvatar,
          isAudioMuted: false,
          isVideoMuted: false
        });
        startRingingSound(true); // Incoming ring sound
      };

      // Listen to call acceptance
      const handleCallAccepted = async ({ answer }: any) => {
        stopRingingSound();
        playCallConnectedBeep();
        if (peerConnectionRef.current && offerCallSignalRef.current) {
          try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
          } catch (e) {
            console.error('Error setting remote description:', e);
          }
        } else {
          setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
        }
      };

      // Listen to incoming ICE candidates
      const handleIceCandidate = async ({ candidate }: any) => {
        if (peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
        }
      };

      // Listen to partner hangup
      const handleCallHungup = () => {
        endVideoCallLocal();
      };

      // Listen to call rejection
      const handleCallRejected = () => {
        stopRingingSound();
        endVideoCallLocal();
      };

      const handleFriendUpdated = () => {
        fetchConversations();
      };

      socket.on('private-msg', handlePrivateMsg);
      socket.on('private-typing', handlePrivateTyping);
      socket.on('incoming-call', handleIncomingCall);
      socket.on('call-accepted', handleCallAccepted);
      socket.on('ice-candidate', handleIceCandidate);
      socket.on('call-hungup', handleCallHungup);
      socket.on('call-rejected', handleCallRejected);
      socket.on('friend-updated', handleFriendUpdated);

      return () => {
        socket.off('private-msg', handlePrivateMsg);
        socket.off('private-typing', handlePrivateTyping);
        socket.off('incoming-call', handleIncomingCall);
        socket.off('call-accepted', handleCallAccepted);
        socket.off('ice-candidate', handleIceCandidate);
        socket.off('call-hungup', handleCallHungup);
        socket.off('call-rejected', handleCallRejected);
        socket.off('friend-updated', handleFriendUpdated);
      };
    }
  }, [socket, isConnected, activeUserId, user]);

  const offerCallSignalRef = useRef<any>(null);

  // Send Text Message
  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeUserId || !socket) return;

    socket.emit('send-private-msg', {
      toUserId: activeUserId,
      message: messageText.trim(),
      type: 'text'
    });

    // Add locally immediately
    const myMsg = {
      id: Math.random().toString(36).substring(2, 9),
      fromUserId: user!.id,
      fromUsername: user!.username,
      fromAvatar: user!.avatar,
      toUserId: activeUserId,
      message: messageText.trim(),
      type: 'text',
      timestamp: new Date().toISOString()
    };

    setConversations(prev => ({
      ...prev,
      [activeUserId]: [...(prev[activeUserId] || []), myMsg]
    }));

    // Update partner details list
    setPartners(prev => prev.map(p => {
      if (p._id === activeUserId) {
        return { ...p, lastMessage: myMsg };
      }
      return p;
    }));

    setMessageText('');
    setIsEmojiOpen(false);
    emitTypingStatus(false);
  };

  // Send voice message
  const sendVoiceMessage = (base64Audio: string, durationSecs: number) => {
    if (!activeUserId || !socket) return;

    socket.emit('send-private-msg', {
      toUserId: activeUserId,
      message: '[Voice message]',
      type: 'voice',
      mediaUrl: base64Audio,
      duration: durationSecs
    });

    const myMsg = {
      id: Math.random().toString(36).substring(2, 9),
      fromUserId: user!.id,
      fromUsername: user!.username,
      fromAvatar: user!.avatar,
      toUserId: activeUserId,
      message: '[Voice message]',
      type: 'voice',
      mediaUrl: base64Audio,
      duration: durationSecs,
      timestamp: new Date().toISOString()
    };

    setConversations(prev => ({
      ...prev,
      [activeUserId]: [...(prev[activeUserId] || []), myMsg]
    }));

    setPartners(prev => prev.map(p => {
      if (p._id === activeUserId) {
        return { ...p, lastMessage: myMsg };
      }
      return p;
    }));
  };

  // Emit typing indicator to socket
  const emitTypingStatus = (isTyping: boolean) => {
    if (socket && activeUserId) {
      socket.emit('send-private-typing', {
        toUserId: activeUserId,
        isTyping
      });
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    emitTypingStatus(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStatus(false);
    }, 2000);
  };

  // Emojis array
  const emojis = ['😂', '🔥', '❤️', '👍', '🎉', '🎮', '👾', '👑', '😮', '😢', '👏', '🙌', '💯', '✨', '🎵', '🎧'];

  const injectEmoji = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    emitTypingStatus(true);
  };

  // Voice recording triggers
  const handleMicPress = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          sendVoiceMessage(base64Audio, recordTimeRef.current);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordTime(0);
      recordTimeRef.current = 0;
      recordIntervalRef.current = setInterval(() => {
        setRecordTime(prev => {
          recordTimeRef.current = prev + 1;
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to record microphone:', err);
    }
  };

  const recordTimeRef = useRef(0);

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
    }
  };

  // Audio Synthesizer: Call Ringtone Dual Beeps
  const startRingingSound = (isIncoming: boolean) => {
    try {
      stopRingingSound();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.connect(ctx.destination);
      ringerGainRef.current = gain;

      const osc1 = ctx.createOscillator();
      osc1.frequency.value = isIncoming ? 400 : 440;
      osc1.connect(gain);

      const osc2 = ctx.createOscillator();
      osc2.frequency.value = isIncoming ? 450 : 480;
      osc2.connect(gain);

      osc1.start();
      osc2.start();

      let beep = true;
      const playBeeps = () => {
        if (!ringerGainRef.current || ctx.state === 'closed') return;
        if (beep) {
          ringerGainRef.current.gain.setValueAtTime(0.08, ctx.currentTime);
        } else {
          ringerGainRef.current.gain.setValueAtTime(0, ctx.currentTime);
        }
        beep = !beep;
      };

      playBeeps();
      callIntervalRef.current = setInterval(playBeeps, isIncoming ? 1500 : 2000);
    } catch (e) {
      console.error('Web Audio Ringtone error:', e);
    }
  };

  const stopRingingSound = () => {
    if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current);
      callIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
      ringerGainRef.current = null;
    }
  };

  const playCallConnectedBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.frequency.value = 600;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  const playDisconnectTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.frequency.value = 250;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  // Start Call Trigger (We act as Caller)
  const startVideoCall = async () => {
    if (!activeUserId || !socket) return;
    
    const targetUser = partners.find(u => u._id === activeUserId);
    if (!targetUser) return;

    setActiveCall({
      status: 'calling',
      peerId: activeUserId,
      peerUsername: targetUser.username,
      peerAvatar: targetUser.avatar,
      isAudioMuted: false,
      isVideoMuted: false
    });

    startRingingSound(false); // Outgoing ring beeps

    try {
      // Request Camera/Mic
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Hook up WebRTC Peer Connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice-candidate', { toUserId: activeUserId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      offerCallSignalRef.current = offer;

      socket.emit('call-user', { toUserId: activeUserId, offer });

    } catch (err) {
      console.error('Camera/Mic permission failed:', err);
    }
  };

  // Accept Incoming Call (We act as Recipient)
  const acceptVideoCall = async () => {
    if (!activeCall || !socket) return;
    stopRingingSound();
    playCallConnectedBeep();

    setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice-candidate', { toUserId: activeCall.peerId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      socket.emit('answer-call', { toUserId: activeCall.peerId, answer: {} });
    } catch (e) {
      console.error('Accept call stream capture failed:', e);
      socket.emit('answer-call', { toUserId: activeCall.peerId, answer: {} });
    }
  };

  // Reject Call
  const rejectVideoCall = () => {
    if (!activeCall || !socket) return;
    stopRingingSound();
    playDisconnectTone();
    socket.emit('reject-call', { toUserId: activeCall.peerId });
    endVideoCallLocal();
  };

  // Hang Up Call
  const hangupVideoCall = () => {
    if (!activeCall || !socket) return;
    stopRingingSound();
    playDisconnectTone();
    socket.emit('hangup-call', { toUserId: activeCall.peerId });
    endVideoCallLocal();
  };

  // Tear down local call state & tracks
  const endVideoCallLocal = () => {
    stopRingingSound();
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    offerCallSignalRef.current = null;
    setActiveCall(null);
  };

  const toggleLocalAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setActiveCall(prev => prev ? { ...prev, isAudioMuted: !audioTrack.enabled } : null);
      }
    }
  };

  const toggleLocalVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setActiveCall(prev => prev ? { ...prev, isVideoMuted: !videoTrack.enabled } : null);
      }
    }
  };

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  // Active chat details (restricted to friends)
  const activePartner = partners.find(u => u._id === activeUserId && u.isFriend);
  const activeConversation = activeUserId ? conversations[activeUserId] || [] : [];
  const isPartnerTyping = activeUserId ? !!typingUsers[activeUserId] : false;

  const friendsList = partners.filter(p => p.isFriend);
  const exploreList = partners.filter(p => !p.isFriend);
  const pendingRequestsCount = partners.filter(p => p.requestReceived).length;

  // Handle clicking a user card
  const selectChat = async (partnerId: string) => {
    setActiveUserId(partnerId);
    setIsEmojiOpen(false);
    setMessageText('');

    // Fetch conversation history from backend
    try {
      const history = await api.chats.getHistory(partnerId);
      setConversations(prev => ({
        ...prev,
        [partnerId]: history
      }));

      // Mark as read in backend
      await api.chats.markAsRead(partnerId);

      // Clear local unreads count
      setPartners(prev => {
        const updated = prev.map(p => p._id === partnerId ? { ...p, unreadCount: 0 } : p);
        
        // Re-update total global unreads
        const totalUnreads = updated.reduce((acc, p) => acc + (p.unreadCount || 0), 0);
        setUnreadPrivateCount(totalUnreads);

        return updated;
      });

    } catch (e) {
      console.error('Error fetching chat history:', e);
    }
  };

  const handleSendFriendRequest = (targetUserId: string) => {
    if (socket) {
      socket.emit('send-friend-request', { targetUserId });
    }
  };

  const handleAcceptFriendRequest = (targetUserId: string) => {
    if (socket) {
      socket.emit('accept-friend-request', { targetUserId });
    }
  };

  const handleDeclineFriendRequest = (targetUserId: string) => {
    if (socket) {
      socket.emit('decline-friend-request', { targetUserId });
    }
  };

  const formatMessageTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#090a0f] cyber-grid relative font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 md:px-6 md:py-8 flex flex-col pb-20 lg:pb-8 animate-fade-in">
        <div className="flex-1 glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl flex flex-row min-h-[500px]">
          
          {/* Left panel: Conversations List */}
          <div className={`w-full lg:w-[320px] shrink-0 border-r border-white/5 flex flex-col ${
            activeUserId ? 'hidden lg:flex' : 'flex'
          }`}>
            <div className="bg-slate-950/40 p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <h2 className="font-display font-extrabold text-base text-gray-150 uppercase tracking-wider">
                  Arena Chat
                </h2>
              </div>
              <div className="text-[10px] bg-emerald-500/10 text-emerald-450 border border-emerald-500/25 px-2 py-0.5 rounded-full font-mono font-bold select-none">
                {partners.length} Challengers
              </div>
            </div>

            {/* Custom Premium Tabs */}
            <div className="flex border-b border-white/5 bg-slate-950/20 p-2 gap-2">
              <button
                onClick={() => setActiveTab('friends')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'friends'
                    ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.07)]'
                    : 'text-gray-400 hover:text-gray-200 border border-transparent'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Friends</span>
                {friendsList.length > 0 && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded-full font-mono font-black">
                    {friendsList.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('explore')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer relative ${
                  activeTab === 'explore'
                    ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.07)]'
                    : 'text-gray-400 hover:text-gray-200 border border-transparent'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Explore</span>
                {pendingRequestsCount > 0 ? (
                  <span className="bg-rose-500 text-white text-[9px] w-4.5 h-4.5 rounded-full font-mono font-black flex items-center justify-center animate-bounce shadow-md shadow-rose-500/20">
                    {pendingRequestsCount}
                  </span>
                ) : (
                  exploreList.length > 0 && (
                    <span className="bg-white/10 text-gray-400 text-[9px] px-1.5 py-0.5 rounded-full font-mono">
                      {exploreList.length}
                    </span>
                  )
                )}
              </button>
            </div>

            {/* List Body */}
            {activeTab === 'friends' ? (
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
                {friendsList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 italic text-gray-500 text-xs">
                    <Users className="w-8 h-8 text-gray-700 mb-2" />
                    No friends added yet.
                    <button 
                      onClick={() => setActiveTab('explore')}
                      className="mt-3 text-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-450 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold font-sans"
                    >
                      Find Challengers
                    </button>
                  </div>
                ) : (
                  friendsList.map((partner: any) => {
                    const lastMsg = partner.lastMessage;
                    const hasUnread = (partner.unreadCount || 0) > 0;
                    const isOnline = partner.status === 'online';
                    
                    return (
                      <button
                        key={partner._id}
                        onClick={() => selectChat(partner._id)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer text-left border ${
                          activeUserId === partner._id 
                            ? 'bg-emerald-500/10 border-emerald-500/20 shadow-md shadow-emerald-500/5' 
                            : 'border-transparent hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative flex-shrink-0">
                            <Avatar name={partner.avatar} size="md" className="ring-1 ring-white/5" />
                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border border-[#090a0f] rounded-full ${
                              isOnline ? 'bg-emerald-500' : 'bg-gray-600'
                            }`} />
                          </div>
                          <div className="min-w-0 leading-tight">
                            <div className="text-sm font-bold text-gray-200 truncate flex items-center gap-1.5">
                              {partner.username}
                              {isOnline && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-cyan-400 font-bold font-mono mt-0.5">Lvl {partner.level} • {partner.rating} Pts</div>
                            {lastMsg && (
                              <p className={`text-xs truncate max-w-[150px] mt-1.5 ${hasUnread ? 'text-white font-extrabold' : 'text-gray-500'}`}>
                                {lastMsg.type === 'voice' ? '🎵 Audio Note' : lastMsg.message}
                              </p>
                            )}
                          </div>
                        </div>

                        {hasUnread && (
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-500 text-white font-mono text-[9px] font-black shrink-0 border border-[#090a0f] shadow-md animate-bounce">
                            {partner.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
                {exploreList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 italic text-gray-500 text-xs">
                    <Users className="w-8 h-8 text-gray-700 mb-2" />
                    No other players found.
                  </div>
                ) : (
                  exploreList.map((partner: any) => {
                    const isOnline = partner.status === 'online';
                    
                    return (
                      <div
                        key={partner._id}
                        className="w-full flex items-center justify-between p-3 rounded-2xl border border-transparent hover:bg-white/[0.01]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative flex-shrink-0">
                            <Avatar name={partner.avatar} size="md" className="ring-1 ring-white/5" />
                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border border-[#090a0f] rounded-full ${
                              isOnline ? 'bg-emerald-500' : 'bg-gray-600'
                            }`} />
                          </div>
                          <div className="min-w-0 leading-tight">
                            <div className="text-sm font-bold text-gray-200 truncate flex items-center gap-1.5">
                              {partner.username}
                              {isOnline && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-cyan-400 font-bold font-mono mt-0.5">Lvl {partner.level} • {partner.rating} Pts</div>
                          </div>
                        </div>

                        {/* Relationship status action buttons */}
                        <div className="flex gap-1 items-center shrink-0">
                          {partner.requestSent ? (
                            <div className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-900 border border-white/5 text-[10px] text-cyan-400 font-bold font-mono">
                              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                              <span>Sent</span>
                            </div>
                          ) : partner.requestReceived ? (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleAcceptFriendRequest(partner._id)}
                                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-450 hover:text-white border border-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                                title="Accept Request"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeclineFriendRequest(partner._id)}
                                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-450 hover:text-white border border-rose-500/20 active:scale-95 transition-all cursor-pointer"
                                title="Decline Request"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSendFriendRequest(partner._id)}
                              className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold font-sans text-xs active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                              title="Add Friend"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Right panel: Active Chat Window */}
          <div className={`flex-1 flex flex-col min-w-0 ${
            activeUserId ? 'flex' : 'hidden lg:flex justify-center items-center bg-[#07080c]/30'
          }`}>
            {activePartner ? (
              // Active Conversation
              <>
                {/* Chat window Header */}
                <div className="bg-slate-950/40 p-4 border-b border-white/5 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={() => setActiveUserId(null)}
                      className="lg:hidden p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Avatar name={activePartner.avatar} size="md" className="ring-1 ring-white/5" />
                    <div className="leading-tight text-left truncate">
                      <div className="text-sm font-bold text-gray-150 truncate">{activePartner.username}</div>
                      <div className="text-[9px] text-gray-550 font-mono mt-0.5 uppercase tracking-wider">
                        {isPartnerTyping ? (
                          <span className="text-emerald-400 font-bold animate-pulse">Typing...</span>
                        ) : activePartner.status === 'online' ? (
                          <span className="text-emerald-450 font-bold">Online</span>
                        ) : (
                          'Offline'
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={startVideoCall}
                    disabled={activePartner.status !== 'online'}
                    className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 hover:bg-emerald-500 hover:text-white active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm shadow-emerald-500/10 disabled:opacity-30 disabled:hover:bg-emerald-500/10 disabled:hover:text-emerald-450 disabled:cursor-not-allowed"
                    title={activePartner.status === 'online' ? 'Video Call' : 'Challenger is offline'}
                  >
                    <Video className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Chat Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/[0.05]">
                  {activeConversation.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 italic text-gray-500 text-xs">
                      💬 Message feed is empty. Start the conversation!
                    </div>
                  ) : (
                    activeConversation.map((msg) => {
                      const isMe = msg.fromUserId === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2.5 items-end ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <Avatar name={msg.fromAvatar} size="sm" className="ring-1 ring-white/5" />
                          <div className={`max-w-[75%] md:max-w-[60%] ${isMe ? 'text-right' : 'text-left'}`}>
                            <div className="text-[10px] font-semibold text-gray-500 mb-0.5 px-1">
                              {msg.fromUsername}
                            </div>
                            
                            <div
                              className={`rounded-2xl px-3.5 py-2 shadow-md inline-block text-left break-words border relative ${
                                isMe
                                  ? 'bg-emerald-600 text-white rounded-br-none border-emerald-500/20 shadow-emerald-600/10'
                                  : 'bg-slate-900/90 text-gray-200 rounded-bl-none border-white/5'
                              }`}
                            >
                              {msg.type === 'voice' ? (
                                <VoicePlayBubble url={msg.mediaUrl} duration={msg.duration} />
                              ) : (
                                <span className="text-xs md:text-sm font-sans leading-relaxed">{msg.message}</span>
                              )}
                              
                              <span className="block text-[8px] text-gray-400 mt-1 leading-none text-right font-mono font-medium">
                                {formatMessageTime(msg.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input bar */}
                <div className="p-3 border-t border-white/5 bg-slate-950/20 flex flex-col gap-2 shrink-0 relative">
                  
                  {/* Custom Emoji Picker drawer */}
                  <AnimatePresence>
                    {isEmojiOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        className="absolute bottom-full left-4 bg-slate-900/95 border border-white/10 rounded-2xl p-2.5 shadow-2xl z-10 flex gap-2 flex-wrap max-w-[260px] backdrop-blur-md"
                      >
                        {emojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => injectEmoji(emoji)}
                            className="text-lg p-1 hover:bg-white/10 rounded-lg cursor-pointer active:scale-90 transition-all select-none"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendText();
                    }}
                    className="flex gap-2 items-center"
                  >
                    <button
                      type="button"
                      onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                        isEmojiOpen
                          ? 'bg-emerald-500/20 text-emerald-450 border-emerald-500/25'
                          : 'bg-slate-900/40 text-gray-400 border-white/5 hover:text-gray-200'
                      }`}
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                    <Input
                      placeholder={recording ? "Recording Voice Note..." : "Type your message..."}
                      value={messageText}
                      onChange={handleTextChange}
                      disabled={recording}
                      className="py-2.5 rounded-xl text-xs sm:text-sm bg-slate-900/40 focus:border-emerald-500/40"
                    />

                    {recording ? (
                      <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 text-rose-400 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold animate-pulse select-none shrink-0">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span>0:{recordTime < 10 ? '0' : ''}{recordTime}</span>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleMicPress}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 active:scale-95 ${
                        recording
                          ? 'bg-rose-500 text-white border-rose-500/30'
                          : 'bg-slate-900/40 text-gray-400 border-white/5 hover:text-gray-200 hover:bg-slate-900/60'
                      }`}
                      title={recording ? "Stop Recording" : "Record Voice Note"}
                    >
                      <Mic className="w-5 h-5" />
                    </button>

                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className="p-2.5 rounded-xl bg-emerald-500 border border-emerald-400/20 text-white active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-default"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              // Empty state landing screen
              <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-slate-950/40 border border-white/5 flex items-center justify-center text-4xl shadow-xl shadow-black/20 select-none">
                  💬
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-gray-250 uppercase tracking-wider">
                    Your Arena Conversations
                  </h3>
                  <p className="text-gray-500 text-xs mt-1.5 max-w-xs leading-relaxed">
                    Select any challenger from the sidebar to chat, record voice notes, or launch real-time video calls.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />

      {/* WhatsApp Full-screen Video Call Overlay UI */}
      <AnimatePresence>
        {activeCall && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-50 bg-[#06070a]/98 backdrop-blur-md flex flex-col justify-between p-6 select-none"
          >
            {/* Top Bar Call Info */}
            <div className="flex justify-between items-center">
              <div className="text-left">
                <span className="text-[10px] text-emerald-400 font-mono font-black uppercase tracking-widest leading-none">
                  🔒 PlayVerse Secure Call
                </span>
                <h3 className="font-display font-extrabold text-lg text-white mt-1">
                  Video Duel with {activeCall.peerUsername}
                </h3>
              </div>
              <div className="bg-slate-900 border border-white/5 rounded-full px-3.5 py-1.5 text-[10px] text-gray-400 font-mono font-bold">
                {activeCall.status === 'calling' ? 'Outgoing Ringing...' : 
                 activeCall.status === 'incoming' ? 'Incoming Video Call...' : 
                 activeCall.status === 'connected' ? 'Secure Connected' : ''}
              </div>
            </div>

            {/* Video Streams Display Pane */}
            <div className="flex-1 my-6 relative rounded-3xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center shadow-inner">
              
              {/* Remote stream (Main Background) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />

              {/* Mock Caller UI if remote video is empty (unconnected/calling) */}
              {activeCall.status !== 'connected' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                  <div className="relative">
                    {/* Ringing waves animation */}
                    <div className="absolute inset-[-10px] rounded-full border border-emerald-500/20 animate-ping opacity-60" />
                    <div className="absolute inset-[-25px] rounded-full border border-emerald-500/10 animate-ping opacity-40 delay-200" />
                    <Avatar name={activeCall.peerAvatar} size="lg" className="border border-white/15 w-24 h-24 relative shadow-2xl" />
                  </div>
                  <div className="text-center leading-tight">
                    <div className="text-xl font-black text-gray-250 font-display uppercase tracking-wide">
                      {activeCall.peerUsername}
                    </div>
                    <p className="text-xs text-gray-550 uppercase tracking-widest font-bold mt-1.5">
                      {activeCall.status === 'calling' ? 'Ringing...' : 'Calling you...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Local Stream (Picture in Picture) */}
              <div className="absolute right-4 bottom-4 w-28 md:w-36 aspect-[3/4] rounded-2xl overflow-hidden border border-white/15 bg-slate-900/90 shadow-2xl z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {activeCall.isVideoMuted && (
                  <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    Cam Off
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex justify-center items-center gap-4 shrink-0 pb-safe-bottom">
              
              {activeCall.status === 'incoming' ? (
                /* Incoming Call Accept/Decline Options */
                <div className="flex gap-6 items-center">
                  <button
                    onClick={rejectVideoCall}
                    className="w-14 h-14 rounded-full bg-rose-600 border border-rose-500/20 text-white flex items-center justify-center hover:bg-rose-500 active:scale-95 transition-all cursor-pointer shadow-lg shadow-rose-600/30"
                    title="Decline Duel Call"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                  <button
                    onClick={acceptVideoCall}
                    className="w-14 h-14 rounded-full bg-emerald-500 border border-emerald-400/20 text-white flex items-center justify-center hover:bg-emerald-400 active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/30 animate-pulse-glow"
                    title="Accept Duel Call"
                  >
                    <Video className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                /* Ongoing Call control buttons */
                <>
                  <button
                    onClick={toggleLocalAudio}
                    className={`w-12 h-12 rounded-full border flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
                      activeCall.isAudioMuted
                        ? 'bg-rose-500/20 border-rose-500/30 text-rose-450'
                        : 'bg-slate-900 border-white/5 text-gray-400 hover:text-gray-200'
                    }`}
                    title={activeCall.isAudioMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {activeCall.isAudioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={hangupVideoCall}
                    className="w-14 h-14 rounded-full bg-rose-600 border border-rose-500/20 text-white flex items-center justify-center hover:bg-rose-500 active:scale-95 transition-all cursor-pointer shadow-lg shadow-rose-600/30"
                    title="End Call"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>

                  <button
                    onClick={toggleLocalVideo}
                    className={`w-12 h-12 rounded-full border flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
                      activeCall.isVideoMuted
                        ? 'bg-rose-500/20 border-rose-500/30 text-rose-450'
                        : 'bg-slate-900 border-white/5 text-gray-400 hover:text-gray-200'
                    }`}
                    title={activeCall.isVideoMuted ? "Start Camera" : "Stop Camera"}
                  >
                    {activeCall.isVideoMuted ? <Camera className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
