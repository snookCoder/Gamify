'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/useAuthStore';
import { useGameStore } from '../../../store/useGameStore';
import { api } from '../../../services/api';
import { Navbar } from '../../../components/Navbar';
import { Chat } from '../../../components/Chat';
import { GameContainer } from '../../../components/GameContainer';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Shield, CheckCircle2, XCircle, Copy, LogOut, Gamepad2, MessageSquare, X, Lock, Link, Swords, Disc, Send, Music } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { 
    room, 
    leaveRoom, 
    toggleReady, 
    startGame, 
    isConnected, 
    onlineUsers, 
    sendInvite,
    chatMessages,
    sendChatMessage,
    socket
  } = useGameStore();

  const [copied, setCopied] = useState(false);
  const [invitedUserIds, setInvitedUserIds] = useState<Record<string, boolean>>({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastReadCount, setLastReadCount] = useState(0);
  const [showQuickChat, setShowQuickChat] = useState(false);
  const [lastMsgId, setLastMsgId] = useState<string | null>(null);
  const [lastGameSlug, setLastGameSlug] = useState<string | null>(null);

  // Guess The Song host lobby state
  const [songCategory, setSongCategory] = useState('Bollywood');
  const [songDifficulty, setSongDifficulty] = useState('medium');
  const [songRounds, setSongRounds] = useState(5);
  const [songCustomSearch, setSongCustomSearch] = useState('');

  const [fetchedSongs, setFetchedSongs] = useState<any[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<any[]>([]);
  const selectedSongIds = selectedSongs.map((s) => s.id);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [opponentSelectedCount, setOpponentSelectedCount] = useState(0);

  useEffect(() => {
    const isHostLocal = room && user ? room.hostId === user.id : false;
    if (room && room.game === 'guess-the-song' && isHostLocal) {
      const fetchSongsLobby = async () => {
        setLoadingSongs(true);
        let searchTerm = musicSearchQuery ? musicSearchQuery : 'Bollywood Hits';

        try {
          const data = await api.music.search(searchTerm, 'IN');
          const results = data.results || [];
          const validSongs = results
            .filter((t: any) => t.previewUrl)
            .map((t: any) => ({
              id: String(t.trackId),
              title: t.trackName || 'Unknown Song',
              artist: t.artistName || 'Unknown Artist',
              album: t.collectionName || 'Single',
              previewUrl: t.previewUrl || '',
              artworkUrl: ''
            }));
          setFetchedSongs(validSongs);
        } catch (err) {
          console.error('Error fetching lobby songs:', err);
        } finally {
          setLoadingSongs(false);
        }
      };

      const timerId = setTimeout(() => {
        fetchSongsLobby();
      }, 300);

      return () => clearTimeout(timerId);
    }
  }, [musicSearchQuery, room?.game, user]);

  // Send curation progress to opponent
  useEffect(() => {
    if (socket && room && selectedSongIds.length > 0) {
      socket.emit('curation-progress', { count: selectedSongIds.length });
    }
  }, [selectedSongIds.length, socket, room]);

  // Listen to opponent curation progress
  useEffect(() => {
    if (socket) {
      const handleOpponentProgress = (data: { count: number }) => {
        setOpponentSelectedCount(data.count);
      };
      socket.on('opponent-curation-progress', handleOpponentProgress);
      return () => {
        socket.off('opponent-curation-progress', handleOpponentProgress);
      };
    }
  }, [socket]);

  useEffect(() => {
    if ((isChatOpen || showQuickChat) && chatMessages) {
      setLastReadCount(chatMessages.length);
    }
  }, [isChatOpen, showQuickChat, chatMessages]);

  const unreadCount = chatMessages ? Math.max(0, chatMessages.length - lastReadCount) : 0;

  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.sender.id !== user?.id && lastMsg.id !== lastMsgId) {
        setLastMsgId(lastMsg.id);
        if (!isChatOpen) {
          setShowQuickChat(true);
        }
      }
    }
  }, [chatMessages, user?.id, isChatOpen, lastMsgId]);

  const handleInvite = (targetUserId: string) => {
    if (room) {
      sendInvite(targetUserId, room.id);
      setInvitedUserIds((prev) => ({ ...prev, [targetUserId]: true }));
      setTimeout(() => {
        setInvitedUserIds((prev) => ({ ...prev, [targetUserId]: false }));
      }, 4000);
    }
  };

  useEffect(() => {
    if (room?.game) {
      setLastGameSlug(room.game);
    }
  }, [room?.game]);

  useEffect(() => {
    if (isConnected && !room) {
      if (lastGameSlug) {
        router.push(`/games/${lastGameSlug}`);
      } else {
        router.push('/');
      }
    }
  }, [room, router, isConnected, lastGameSlug]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, router]);

  if (!room || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#06070a] relative overflow-hidden select-none">
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/5 rounded-full filter blur-[80px] pointer-events-none" />

        <div className="flex flex-col items-center z-10">
          <div className="relative flex items-center justify-center w-24 h-24 mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-violet-500/40"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-2 rounded-full border-2 border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
            />
            <motion.div
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-2xl flex items-center justify-center border border-violet-400/20 shadow-lg shadow-violet-500/20"
            >
              <Gamepad2 className="w-7 h-7 text-white" />
            </motion.div>
          </div>

          <motion.h1
            initial={{ letterSpacing: "0.2em", opacity: 0.7 }}
            animate={{ letterSpacing: "0.3em", opacity: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            className="font-display font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-white to-cyan-400 tracking-[0.25em] uppercase pl-[0.25em]"
          >
            PlayVerse
          </motion.h1>

          <motion.span
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.15em] mt-3 font-mono"
          >
            Syncing Arena Details...
          </motion.span>
        </div>
      </div>
    );
  }

  const isHost = room.hostId === user.id;
  const myPlayerInfo = room.players.find((p) => p.id === user.id);
  const guestPlayer = room.players[1];

  const copyInviteLink = () => {
    const link = `${window.location.origin}/room/${room.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (room && room.game === 'guess-the-song') {
      startGame({
        category: songCategory,
        difficulty: songDifficulty,
        songs: selectedSongs
      });
    } else {
      startGame();
    }
  };

  const handleToggleReady = () => {
    if (myPlayerInfo) {
      toggleReady(!myPlayerInfo.isReady);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#090a0f] cyber-grid">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* Sleek Header Bar - Compact & Non-Card on Mobile */}
        <div className="relative sm:glass-panel sm:rounded-2xl px-2 sm:px-6 py-2 sm:py-4 flex flex-row items-center justify-between gap-2 sm:gap-4 sm:border sm:border-white/5 sm:shadow-xl overflow-hidden w-full">
          {/* Subtle glow border (Desktop Only) */}
          <div className="hidden sm:block absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-violet-600 via-transparent to-cyan-500 opacity-50" />
          
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono shrink-0">
                Match Room
              </span>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 bg-slate-950/60 pl-2 sm:pl-3 pr-1 sm:pr-1.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border border-white/5">
              <span className="hidden xs:inline text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">Code:</span>
              <span className="text-xs sm:text-sm font-black text-violet-400 font-mono tracking-widest">
                {room.id}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyInviteLink}
                className="p-0.5 min-w-0 hover:bg-white/5 rounded-lg cursor-pointer"
                title="Copy Invite Link"
              >
                {copied ? (
                  <span className="text-[8px] text-emerald-400 font-bold font-mono">Copied!</span>
                ) : (
                  <Copy className="w-3 h-3 text-gray-450 hover:text-white" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            variant="danger" 
            size="sm" 
            onClick={handleLeaveRoom} 
            className="gap-1 sm:gap-1.5 border border-red-500/20 shadow-md cursor-pointer text-[10px] sm:text-xs shrink-0 px-2 sm:px-4 py-1 sm:py-2"
          >
            <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Leave Lobby
          </Button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            {room.status === 'waiting' ? (
              <div className="relative glass-panel rounded-3xl p-3 sm:p-8 flex flex-col items-center shadow-2xl border border-white/5 min-h-0 sm:min-h-[440px] justify-between overflow-hidden">
                {/* Background Ambient Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-violet-600/5 rounded-full filter blur-[60px] pointer-events-none" />
                
                {/* Header */}
                <div className="text-center z-10">
                  <h2 className="text-xs font-black text-violet-400 uppercase tracking-[0.25em] font-mono">
                    MATCHMAKING LOBBY
                  </h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">
                    Waiting for gladiators to accept challenge
                  </p>
                </div>

                {/* Slots Grid */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-6 items-center sm:items-stretch sm:flex-1 my-2.5 sm:my-8 z-10">
                  
                  {/* Slot 1: Host */}
                  <div className="relative flex flex-row sm:flex-col items-center justify-between p-2.5 sm:p-6 bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-violet-500/20 rounded-2xl shadow-lg group hover:border-violet-500/30 transition-all duration-300 w-full gap-3 sm:gap-0">
                    <div className="flex flex-row sm:flex-col items-center gap-2.5 sm:gap-0 text-left sm:text-center">
                      <div className="relative p-0.5 bg-violet-500/10 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.1)] group-hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-all shrink-0">
                        <Avatar name={room.players[0]?.avatar} size="lg" />
                        <span className="absolute bottom-1 right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-[0_0_8px_#10b981]" />
                      </div>
                      
                      <div className="flex flex-col items-start sm:items-center">
                        <div className="flex items-center gap-1 mt-0 sm:mt-4">
                          <Shield className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          <h3 className="font-display font-black text-sm sm:text-lg text-gray-200 tracking-wide truncate max-w-[100px] sm:max-w-none">
                            {room.players[0]?.username}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 sm:mt-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] sm:text-[10px] text-gray-400 font-mono">
                          <span>Rating:</span>
                          <span className="font-bold text-violet-400">{room.players[0]?.rating} PTS</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-auto sm:w-full mt-0 sm:mt-6 shrink-0">
                      <span className="flex items-center justify-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs text-emerald-400 font-black bg-emerald-500/10 px-2 sm:px-0 py-1 sm:py-2 rounded-lg sm:rounded-xl border border-emerald-500/20 uppercase tracking-wider font-mono shadow-inner">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 animate-pulse" /> HOST READY
                      </span>
                    </div>
                  </div>

                  {/* Slot 2: Guest / Challenger */}
                  <div className="relative flex flex-row sm:flex-col items-center justify-between p-2.5 sm:p-6 bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-white/5 rounded-2xl shadow-lg transition-all duration-300 w-full gap-3 sm:gap-0">
                    
                    {guestPlayer ? (
                      /* Active Guest Player */
                      <>
                        <div className="flex flex-row sm:flex-col items-center gap-2.5 sm:gap-0 text-left sm:text-center">
                          <div className="relative p-0.5 bg-cyan-500/10 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.1)] transition-all shrink-0">
                            <Avatar name={guestPlayer.avatar} size="lg" />
                            <span className="absolute bottom-1 right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-[0_0_8px_#10b981]" />
                          </div>
                          
                          <div className="flex flex-col items-start sm:items-center">
                            <h3 className="font-display font-black text-sm sm:text-lg text-gray-200 mt-0 sm:mt-4 tracking-wide truncate max-w-[100px] sm:max-w-none">
                              {guestPlayer.username}
                            </h3>
                            <div className="flex items-center gap-1 mt-0.5 sm:mt-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] sm:text-[10px] text-gray-400 font-mono">
                              <span>Rating:</span>
                              <span className="font-bold text-cyan-400">{guestPlayer.rating} PTS</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-auto sm:w-full mt-0 sm:mt-6 shrink-0">
                          <span
                            className={`flex items-center justify-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs font-black px-2.5 sm:px-0 py-1 sm:py-2 rounded-lg sm:rounded-xl border uppercase tracking-wider font-mono shadow-inner ${
                              guestPlayer.isReady
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                            }`}
                          >
                            {guestPlayer.isReady ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 animate-pulse" /> COMBAT READY
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> PREPARING...
                              </>
                            )}
                          </span>
                        </div>
                      </>
                    ) : (
                      /* Empty Slot - Waiting & Invite */
                      (() => {
                        const availableInvitees = onlineUsers.filter((u) => u._id !== user.id);
                        return (
                          <div className="w-full flex flex-col items-center justify-between h-full">
                            
                            {/* Visual Search radar when list is empty */}
                            {availableInvitees.length === 0 ? (
                              <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center w-full my-auto py-1 sm:py-4 gap-4 sm:gap-0">
                                <div className="relative w-10 h-10 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                                  {/* Dashed spin circle */}
                                  <div className="absolute inset-0 rounded-full border border-dashed border-cyan-500/30 animate-spin" />
                                  <div className="absolute inset-1.5 sm:inset-2.5 rounded-full border border-cyan-500/10 animate-ping opacity-60" />
                                  <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-full bg-cyan-600/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                    <span className="text-[10px] sm:text-lg font-black animate-pulse">?</span>
                                  </div>
                                </div>
                                
                                <div className="flex-1 text-left sm:text-center">
                                  <h4 className="text-[10px] sm:text-sm font-black text-gray-300 tracking-wide">WAITING FOR CHALLENGER</h4>
                                  <p className="text-[8px] sm:text-[10px] text-gray-500 mt-0.5 sm:mt-1 max-w-[180px]">
                                    Lobby active. Invite a friend!
                                  </p>
                                </div>
                                
                                <button 
                                  onClick={copyInviteLink}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[8px] sm:text-[10px] font-bold text-cyan-400 border border-cyan-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
                                >
                                  <Link className="w-2.5 h-2.5" /> Copy Link
                                </button>
                              </div>
                            ) : (
                              /* List of Online Challengers to Invite */
                              <div className="w-full flex flex-col items-stretch text-left py-1">
                                <h3 className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center font-display">
                                  INVITE ONLINE CHALLENGERS
                                </h3>
                                
                                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                                  {availableInvitees.map((onlineUser) => {
                                    const isInvited = !!invitedUserIds[onlineUser._id];
                                    return (
                                      <div
                                        key={onlineUser._id}
                                        className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/40 border border-white/5 hover:border-violet-500/20 transition-all"
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <Avatar name={onlineUser.avatar} size="sm" />
                                          <div className="leading-tight truncate">
                                            <div className="text-[10px] sm:text-xs font-bold text-gray-200 truncate max-w-[80px] sm:max-w-[85px]">
                                              {onlineUser.username}
                                            </div>
                                            <div className="text-[8px] sm:text-[9px] text-cyan-455 font-mono mt-0.5">
                                              {onlineUser.rating} PTS
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          variant={isInvited ? 'secondary' : 'outline'}
                                          size="sm"
                                          disabled={isInvited}
                                          onClick={() => handleInvite(onlineUser._id)}
                                          className="text-[8px] sm:text-[9px] px-2 py-0.5 font-bold border-cyan-500/20 text-cyan-400 hover:bg-cyan-600 hover:text-white shrink-0 cursor-pointer"
                                        >
                                          {isInvited ? 'Sent' : 'Invite'}
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>

                {/* Guess the Song Host Settings */}
                {isHost && room && room.game === 'guess-the-song' && (
                  <div className="w-full max-w-sm p-4 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-inner mb-4 flex flex-col gap-3">
                    <div className="text-[10px] text-violet-400 font-extrabold uppercase tracking-widest mb-1">
                      ⚙️ Room Settings (Host Only)
                    </div>
                    
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[10px] text-gray-400 font-bold uppercase">Difficulty</label>
                      <select 
                        value={songDifficulty} 
                        onChange={(e) => setSongDifficulty(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-violet-500 cursor-pointer animate-none"
                      >
                        <option value="easy">Easy (20s preview)</option>
                        <option value="medium">Medium (15s preview)</option>
                        <option value="hard">Hard (10s preview)</option>
                        <option value="extreme">Extreme (5s preview)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 text-left border-t border-white/5 pt-2 mt-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase flex justify-between">
                        <span>Select Playlist (Choose exactly 5 Bollywood songs)</span>
                      </label>
                      
                      <Button
                        variant="outline"
                        onClick={() => setIsMusicModalOpen(true)}
                        className="w-full py-2.5 text-xs font-bold border-violet-500/30 text-violet-400 hover:bg-violet-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Music className="w-3.5 h-3.5" /> Select Music ({selectedSongIds.length}/5)
                      </Button>
                    </div>
                  </div>
                )}

                {/* Guess the Song Guest waiting/curation status */}
                {room.game === 'guess-the-song' && !isHost && (
                  <div className="w-full max-w-sm p-3 bg-slate-900/40 rounded-2xl border border-white/5 text-center text-xs text-gray-400 mb-4 z-10">
                    {opponentSelectedCount > 0 ? (
                      <span className="text-violet-400 animate-pulse font-bold">Host is curating playlist ({opponentSelectedCount}/5 selected)...</span>
                    ) : (
                      <span>Waiting for host to select music...</span>
                    )}
                  </div>
                )}

                {/* Launch Button Section */}
                <div className="w-full max-w-sm mt-4 z-10">
                  {isHost ? (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleStartGame}
                      disabled={room.players.length < 2 || !room.players.every((p) => p.isReady)}
                      className={`py-3.5 text-xs font-black tracking-[0.2em] uppercase rounded-xl border ${
                        room.players.length < 2 || !room.players.every((p) => p.isReady)
                          ? 'border-white/5 opacity-40'
                          : 'border-violet-400/20 shadow-lg shadow-violet-500/20 animate-pulse-glow hover:brightness-110'
                      } cursor-pointer`}
                    >
                      {room.players.length < 2 || !room.players.every((p) => p.isReady) ? (
                        <span className="flex items-center justify-center gap-2">
                          <Lock className="w-4 h-4" /> START MATCH
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Swords className="w-4 h-4 text-white animate-bounce" /> LAUNCH DUEL
                        </span>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant={myPlayerInfo?.isReady ? 'secondary' : 'primary'}
                      fullWidth
                      onClick={handleToggleReady}
                      className={`py-3.5 text-xs font-black tracking-[0.2em] uppercase rounded-xl border cursor-pointer ${
                        myPlayerInfo?.isReady 
                          ? 'border-slate-700/50 hover:bg-slate-750' 
                          : 'border-violet-500/30 animate-pulse-glow'
                      }`}
                    >
                      {myPlayerInfo?.isReady ? 'CANCEL READY' : 'SET COMBAT READY'}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl overflow-hidden shadow-lg border border-white/5 min-h-[400px]">
                <GameContainer />
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <Chat />
          </div>
        </div>
      </main>

      {/* Mobile Floating Chat Button */}
      {!isChatOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => {
            setShowQuickChat(!showQuickChat);
          }}
          className={`fixed bottom-6 right-6 z-40 lg:hidden text-white p-4 rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer border ${
            showQuickChat 
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-cyan-500/30 border-cyan-500/30' 
              : 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/30 border-violet-500/30'
          }`}
        >
          {showQuickChat ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          {unreadCount > 0 && !showQuickChat && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-900 shadow-md">
              {unreadCount}
            </span>
          )}
        </motion.button>
      )}

      {/* Mobile Quick Chat Popup */}
      {showQuickChat && !isChatOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="fixed bottom-24 right-6 left-6 sm:left-auto sm:w-80 z-45 bg-[#090a0f]/95 backdrop-blur-md border border-violet-500/30 rounded-2xl p-3 shadow-xl flex flex-col gap-2"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest font-mono">
              Quick Chat
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsChatOpen(true);
                  setShowQuickChat(false);
                }}
                className="text-[9px] font-black text-cyan-400 hover:text-cyan-300 font-mono uppercase bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                Expand
              </button>
              <button
                onClick={() => setShowQuickChat(false)}
                className="text-gray-400 hover:text-white p-0.5 rounded hover:bg-white/5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Last Message Content */}
          <div className="flex-1 min-h-[50px] max-h-[80px] overflow-y-auto py-1">
            {chatMessages.length === 0 ? (
              <div className="text-[10px] text-gray-500 italic text-center py-2">
                No messages yet. Send a quick chat!
              </div>
            ) : (
              (() => {
                const lastMsg = chatMessages[chatMessages.length - 1];
                const isMe = lastMsg.sender.id === user?.id;
                return (
                  <div className={`flex gap-2 items-start ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar name={lastMsg.sender.avatar} size="sm" />
                    <div className={`max-w-[80%] ${isMe ? 'text-right' : 'text-left'}`}>
                      <div className="text-[8px] font-semibold text-gray-500 mb-0.5 px-1 truncate max-w-[100px]">
                        {lastMsg.sender.username}
                      </div>
                      <div
                        className={`text-[11px] px-2.5 py-1.5 rounded-xl shadow-sm inline-block break-words ${
                          isMe
                            ? 'bg-violet-600 text-white rounded-br-none'
                            : 'bg-slate-800/80 text-gray-200 rounded-bl-none border border-slate-700/30'
                        }`}
                      >
                        {lastMsg.message}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* Quick Reply Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const input = form.elements.namedItem('quickReply') as HTMLInputElement;
              if (input && input.value.trim()) {
                sendChatMessage(input.value.trim());
                input.value = '';
              }
            }}
            className="flex gap-1.5 border-t border-white/5 pt-2"
          >
            <input
              name="quickReply"
              type="text"
              placeholder="Type reply..."
              className="flex-1 py-1.5 px-2.5 rounded-lg text-[11px] bg-slate-950/60 border border-white/10 text-gray-200 focus:outline-none focus:border-violet-500"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-500 text-white p-1.5 rounded-lg active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </motion.div>
      )}

      {/* Curation Music Selection Modal */}
      {isMusicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsMusicModalOpen(false)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-4xl bg-[#090a0f] border border-violet-500/20 rounded-3xl p-5 shadow-2xl z-10 flex flex-col gap-4 relative overflow-hidden h-[90vh] md:h-[600px]"
          >
            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-violet-600 via-transparent to-cyan-500 opacity-50" />
            
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest font-mono">Bollywood Challenge Curation</span>
                <h3 className="font-display font-black text-base text-gray-100 mt-0.5">Select exactly 5 songs</h3>
              </div>
              <button
                onClick={() => setIsMusicModalOpen(false)}
                className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
              {/* Left side: Search & Results */}
              <div className="flex-1 flex flex-col gap-3 min-h-0">
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={musicSearchQuery}
                    onChange={(e) => setMusicSearchQuery(e.target.value)}
                    placeholder="Search Bollywood songs or artists (e.g. Arijit Singh)..."
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                  />
                </div>

                {/* Song search list results */}
                <div className="flex-1 overflow-y-auto border border-white/5 bg-slate-950/40 rounded-2xl p-2 flex flex-col gap-1.5 scrollbar-thin font-sans">
                  {loadingSongs ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[11px] text-gray-500 py-12 italic animate-pulse">
                      Searching tracks...
                    </div>
                  ) : fetchedSongs.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[11px] text-gray-500 py-12 italic">
                      No Bollywood songs found. Try a different search!
                    </div>
                  ) : (
                    fetchedSongs.map((song) => {
                      const isChecked = selectedSongIds.includes(song.id);
                      return (
                        <div 
                          key={song.id} 
                          className={`flex items-center justify-between p-2 rounded-xl border transition-colors select-none ${
                            isChecked ? 'bg-violet-600/10 border-violet-500/20' : 'border border-transparent hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className="w-8 h-8 bg-slate-900 flex items-center justify-center shrink-0 rounded shadow-md border border-white/5">
                              <Disc className="w-4 h-4 text-gray-600" />
                            </div>
                            <div className="flex flex-col leading-tight truncate text-left">
                              <span className="text-[11px] font-black text-white truncate max-w-[200px]">{song.title}</span>
                              <span className="text-[9px] text-gray-400 truncate max-w-[200px] mt-0.5">{song.artist}</span>
                            </div>
                          </div>

                          {isChecked ? (
                            <button
                              type="button"
                              onClick={() => setSelectedSongs((prev) => prev.filter((s) => s.id !== song.id))}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-rose-600/20 hover:border-rose-500/30 hover:text-rose-400 cursor-pointer transition-all shrink-0 text-xs font-black font-mono shadow-sm"
                              title="Remove from queue"
                            >
                              ✓
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedSongs.length >= 5) return;
                                setSelectedSongs((prev) => [...prev, song]);
                              }}
                              disabled={selectedSongs.length >= 5}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-400 hover:bg-violet-600 hover:text-white disabled:opacity-40 disabled:hover:bg-violet-600/20 disabled:hover:text-violet-400 cursor-pointer transition-all shrink-0 text-sm font-bold font-mono shadow-sm"
                              title="Add to queue"
                            >
                              +
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right side: Selected Songs Queue */}
              <div className="w-full md:w-[280px] flex flex-col gap-3 min-h-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-5">
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono font-bold px-1">
                  <span className="uppercase tracking-widest text-violet-400 font-mono">Selected Queue</span>
                  <span>{selectedSongs.length} / 5</span>
                </div>

                <div className="flex-1 overflow-y-auto border border-white/5 bg-slate-950/40 rounded-2xl p-2 flex flex-col gap-1.5 scrollbar-thin min-h-[120px]">
                  {selectedSongs.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-gray-500 text-center py-8 px-2 italic leading-relaxed">
                      Queue is empty.<br />Add 5 songs from search results.
                    </div>
                  ) : (
                    selectedSongs.map((song, idx) => (
                      <div 
                        key={song.id} 
                        className="flex items-center justify-between p-2 rounded-xl bg-violet-950/10 border border-violet-500/10 hover:border-violet-500/20 transition-all"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[9px] font-mono font-bold text-violet-400/80 w-3 text-right">{idx + 1}</span>
                          <div className="w-7 h-7 bg-slate-900 flex items-center justify-center shrink-0 rounded shadow-md border border-white/5">
                            <Disc className="w-3.5 h-3.5 text-gray-600" />
                          </div>
                          <div className="flex flex-col leading-tight truncate text-left">
                            <span className="text-[10px] font-bold text-white truncate max-w-[130px]">{song.title}</span>
                            <span className="text-[8px] text-gray-400 truncate max-w-[130px] mt-0.5">{song.artist}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedSongs((prev) => prev.filter((s) => s.id !== song.id))}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white cursor-pointer transition-all shrink-0 text-xs font-bold font-mono shadow-sm"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
                
                {selectedSongs.length !== 5 && (
                  <div className="text-[9px] text-center text-amber-400/80 font-mono py-1.5 bg-amber-500/5 border border-amber-500/10 rounded-xl font-sans">
                    ⚠️ Select {5 - selectedSongs.length} more song(s)
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="primary"
              disabled={selectedSongs.length !== 5}
              onClick={() => setIsMusicModalOpen(false)}
              className="w-full py-3 text-xs font-black tracking-wider uppercase rounded-xl cursor-pointer mt-1"
            >
              Confirm Selection
            </Button>
          </motion.div>
        </div>
      )}

      {/* Mobile Chat Drawer Overlay */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsChatOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          {/* Drawer Body */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-xs h-full bg-[#090a0f] border-l border-white/5 flex flex-col p-4 shadow-2xl z-10"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                <h3 className="font-display font-extrabold text-sm text-gray-200 uppercase tracking-wider">
                  Room Chat
                </h3>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Scrollable chat body */}
            <div className="flex-1 min-h-0">
              <Chat />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
