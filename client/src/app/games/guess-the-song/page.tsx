'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/useAuthStore';
import { useGameStore } from '../../../store/useGameStore';
import { Navbar } from '../../../components/Navbar';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ArrowLeft, Users, Gamepad2, RefreshCw, Swords, PlusCircle, ArrowRight, KeyRound, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GuessTheSongLobby() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const { 
    connectSocket, 
    room, 
    onlineUsers, 
    createRoom, 
    sendInvite, 
    refreshLobby, 
    publicRooms, 
    joinRoom,
    isConnected
  } = useGameStore();

  const [pendingInviteUserId, setPendingInviteUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [modeFilter, setModeFilter] = useState<'quick' | 'private' | 'code'>('quick');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    } else if (token) {
      connectSocket(token);
    }
  }, [isAuthenticated, token, router, connectSocket]);

  useEffect(() => {
    if (isConnected) {
      refreshLobby();
    }
  }, [isConnected, refreshLobby]);

  useEffect(() => {
    if (room) {
      if (pendingInviteUserId) {
        sendInvite(pendingInviteUserId, room.id);
        setPendingInviteUserId(null);
      }
      router.push(`/room/${room.id}`);
    }
  }, [room, router, pendingInviteUserId, sendInvite]);

  const handleInvitePlayer = (targetUserId: string) => {
    setPendingInviteUserId(targetUserId);
    createRoom('guess-the-song', false);
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCodeInput.trim().length === 5) {
      joinRoom(roomCodeInput.trim().toUpperCase());
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshLobby();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#06070a] relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full filter blur-[120px] pointer-events-none" />
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
            <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-2xl flex items-center justify-center border border-violet-400/20 shadow-lg shadow-violet-500/20">
              <Gamepad2 className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="font-display font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-white to-cyan-400 tracking-[0.25em] uppercase">
            PlayVerse
          </h1>
        </div>
      </div>
    );
  }

  // Construct list of all active players, placing current user at the top
  const activePlayers = [];
  const selfOnline = onlineUsers.find((u) => u._id === user.id);
  if (selfOnline) {
    activePlayers.push({ ...selfOnline, isSelf: true });
  } else {
    activePlayers.push({
      _id: user.id,
      username: user.username,
      avatar: user.avatar,
      level: user.level,
      rating: user.rating,
      isSelf: true
    });
  }
  const challengers = onlineUsers.filter((u) => u._id !== user.id);
  activePlayers.push(...challengers);
  const guessPublicRooms = publicRooms.filter((r) => r.game === 'guess-the-song');

  return (
    <div className="flex flex-col min-h-screen bg-[#090a0f] cyber-grid relative">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* Back navigation */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="gap-2 text-gray-400 hover:text-white px-0 hover:bg-transparent cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </div>

        {/* Centered Single-Column Layout */}
        <div className="max-w-2xl w-full mx-auto space-y-5">
            {/* Visual Hero Card - Simplified & Shrunk */}
            <div className="relative glass-panel rounded-2xl overflow-hidden shadow-md border border-white/5 p-4 flex items-center justify-between gap-4 card-transition hover-glow-purple">
              <div className="absolute -top-16 -left-16 w-40 h-40 bg-violet-600/10 rounded-full filter blur-[40px] pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-cyan-600/10 rounded-full filter blur-[40px] pointer-events-none" />
              
              <div className="z-10 flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h1 className="font-display font-black text-lg md:text-xl text-white tracking-wide leading-tight truncate">
                    Guess The Song Arena
                  </h1>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/20 text-violet-400 text-[9px] font-bold uppercase tracking-wider font-mono">
                    <Sparkles className="w-3 h-3" /> Max: 20 Players
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed max-w-md truncate">
                  Test your music trivia knowledge! Listen to short previews and guess the songs.
                </p>
              </div>

              {/* Shrunk Vinyl Disc Hero image/icon */}
              <div className="z-10 w-14 h-14 shrink-0 hidden sm:flex items-center justify-center p-0.5 bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 rounded-xl border border-white/5 shadow-inner aspect-square overflow-hidden relative group select-none">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                  className="text-3xl select-none"
                >
                  💿
                </motion.div>
              </div>
            </div>

            {/* Game Mode Dropdown Console */}
            <div className="glass-panel rounded-2xl p-4 border border-white/5 shadow-lg space-y-4">
              <div className="flex items-center justify-between gap-4">
                <label className="font-display font-bold text-xs text-gray-400 uppercase tracking-wider shrink-0">
                  Game Mode:
                </label>
                <div className="relative w-44 shrink-0">
                  <select
                    value={modeFilter}
                    onChange={(e) => setModeFilter(e.target.value as any)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-gray-200 focus:outline-none focus:border-violet-500/50 cursor-pointer appearance-none"
                  >
                    <option value="quick">⚔️ Quick Play</option>
                    <option value="private">🔒 Private Duel</option>
                    <option value="code">🔑 Enter Code</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[10px]">
                    ▼
                  </div>
                </div>
              </div>

              {/* Active mode panel content */}
              <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 min-h-[90px] flex flex-col justify-center hover-glow-purple transition-all">
                {modeFilter === 'quick' && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-left">
                      <h3 className="font-display font-extrabold text-sm text-gray-200">Quick Match Arena</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Find active lobbies or host a public match instantly. System matches you automatically.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => createRoom('guess-the-song', false)}
                      className="w-full sm:w-auto px-6 py-2 text-xs font-bold cursor-pointer shrink-0"
                    >
                      <Swords className="w-4 h-4 mr-1.5 inline-block" /> Find Match
                    </Button>
                  </div>
                )}

                {modeFilter === 'private' && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-left">
                      <h3 className="font-display font-extrabold text-sm text-gray-200">Host Private Duel</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Create an invite-only lobby. Share the unique 5-letter room code with a friend.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => createRoom('guess-the-song', true)}
                      className="w-full sm:w-auto px-6 py-2 text-xs font-bold border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 cursor-pointer shrink-0"
                    >
                      <PlusCircle className="w-4 h-4 mr-1.5 inline-block" /> Host Private
                    </Button>
                  </div>
                )}

                {modeFilter === 'code' && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-left">
                      <h3 className="font-display font-extrabold text-sm text-gray-200">Enter Invite Code</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Enter a friend's 5-letter invite code to join their room instantly.
                      </p>
                    </div>
                    <form onSubmit={handleJoinByCode} className="flex gap-2 w-full sm:w-auto shrink-0">
                      <Input
                        placeholder="CODE"
                        value={roomCodeInput}
                        onChange={(e) => setRoomCodeInput(e.target.value.slice(0, 5))}
                        className="uppercase text-center tracking-widest font-mono font-black text-xs bg-slate-900 border-white/10 w-32 h-9 rounded-lg"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={roomCodeInput.trim().length !== 5}
                        className="px-4 py-2 text-xs font-bold cursor-pointer h-9 rounded-lg"
                      >
                        Join Room
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Active Players List */}
            <div className="glass-panel rounded-2xl p-4 border border-white/5 shadow-lg space-y-3 font-sans">
              <h2 className="font-display font-bold text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-cyan-400" /> ACTIVE PLAYERS
              </h2>
              <div className="divide-y divide-white/5 max-h-[220px] overflow-y-auto pr-1">
                {activePlayers.map((onlineUser) => {
                  const isMe = onlineUser._id === user.id || onlineUser.isSelf;
                  return (
                    <div
                      key={onlineUser._id}
                      className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar name={onlineUser.avatar} size="sm" />
                        <div className="text-left leading-tight">
                          <div className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                            {onlineUser.username}
                            {isMe && (
                              <span className="text-[8px] bg-violet-500/20 text-violet-400 border border-violet-500/25 px-1.5 py-0.5 rounded font-black uppercase tracking-wider font-mono">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-cyan-400 font-semibold mt-0.5 font-mono">
                            Lvl {onlineUser.level} • {onlineUser.rating} Pts
                          </div>
                        </div>
                      </div>

                      {isMe ? (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono select-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ACTIVE
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInvitePlayer(onlineUser._id)}
                          className="text-[10px] px-3 py-1 font-bold border-cyan-500/30 text-cyan-400 hover:bg-cyan-600 hover:text-white cursor-pointer transition-colors"
                        >
                          Challenge
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
      </main>
    </div>
  );
}
