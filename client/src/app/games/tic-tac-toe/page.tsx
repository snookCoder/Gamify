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

export default function TicTacToeLobby() {
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
    joinRoom 
  } = useGameStore();

  const [pendingInviteUserId, setPendingInviteUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeTab, setActiveTab] = useState<'rooms' | 'players'>('rooms');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    } else if (token) {
      connectSocket(token);
    }
  }, [isAuthenticated, token, router, connectSocket]);

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
    createRoom('tic-tac-toe', false);
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

  if (!isAuthenticated || !user) {
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

  const challengers = onlineUsers.filter((u) => u._id !== user.id);

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

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Game Visual & Main Actions Console (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Visual Hero Card */}
            <div className="relative glass-panel rounded-3xl overflow-hidden shadow-xl border border-white/5 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 card-transition hover-glow-purple">
              {/* Background Ambient Glow */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-violet-600/10 rounded-full filter blur-[60px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-600/10 rounded-full filter blur-[60px] pointer-events-none" />
              
              {/* Text Info */}
              <div className="z-10 flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider mb-4 font-mono">
                  <Sparkles className="w-3.5 h-3.5" /> Bet: 50 Coins
                </div>
                <h1 className="font-display font-black text-3xl text-white tracking-wide leading-tight">
                  Tic-Tac-Toe Arena
                </h1>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-md">
                  Challenge online players in real-time or duel friends in private lobbies. Conquer the 3x3 grid to win the pot!
                </p>
              </div>

              {/* Real Game Image */}
              <div className="z-10 w-44 sm:w-48 shrink-0 flex items-center justify-center p-1 bg-slate-950/40 rounded-2xl border border-white/5 shadow-inner">
                <img 
                  src="/tic_tac_toe_hero.png" 
                  alt="Tic-Tac-Toe Neon Board" 
                  className="rounded-xl w-full object-cover aspect-square hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Game Modes Console */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg space-y-6">
              <h2 className="font-display font-bold text-sm text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-violet-500" /> SELECT GAME MODE
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mode 1: Quick Match */}
                <div className="p-5 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col justify-between hover:border-violet-500/30 card-transition group">
                  <div>
                    <h3 className="font-display font-bold text-base text-gray-200 group-hover:text-violet-400 transition-colors">
                      Quick Arena Match
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Instant duel with matchmaking. Automatically match with any active lobby or host a public one.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => createRoom('tic-tac-toe', false)}
                    className="mt-5 w-full flex items-center gap-1.5 py-3 cursor-pointer"
                  >
                    <Swords className="w-4 h-4" /> Quick Play
                  </Button>
                </div>

                {/* Mode 2: Private Duel */}
                <div className="p-5 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col justify-between hover:border-cyan-500/30 card-transition group">
                  <div>
                    <h3 className="font-display font-bold text-base text-gray-200 group-hover:text-cyan-400 transition-colors">
                      Host Private Match
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Create an invite-only arena room. Perfect for challenges with friends using direct link sharing.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => createRoom('tic-tac-toe', true)}
                    className="mt-5 w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5" /> Host Private
                  </Button>
                </div>
              </div>

              {/* Mode 3: Join via Room Code */}
              <div className="p-5 rounded-xl bg-slate-950/40 border border-white/5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-base text-gray-200 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-500" /> Enter Room Code
                    </h3>
                    <p className="text-xs text-gray-500">
                      Got an invite code? Input the 5-letter code to join immediately.
                    </p>
                  </div>
                  
                  <form onSubmit={handleJoinByCode} className="flex gap-2 w-full sm:w-auto shrink-0">
                    <Input
                      placeholder="5-LETTER CODE"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.slice(0, 5))}
                      className="uppercase text-center tracking-widest font-mono font-black text-sm bg-slate-900 border-white/10 max-w-[150px] w-full"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={roomCodeInput.trim().length !== 5}
                      className="px-4 cursor-pointer shrink-0"
                    >
                      Join <ArrowRight className="ml-1 w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Arena Social Hub - Tabbed active rooms & online opponents (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="glass-panel rounded-2xl flex flex-col h-[520px] shadow-lg border border-white/5 overflow-hidden">
              
              {/* Header Tab Bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-slate-950/30">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('rooms')}
                    className={`font-display font-bold text-xs uppercase tracking-wider pb-1.5 border-b-2 transition-all cursor-pointer ${
                      activeTab === 'rooms'
                        ? 'border-violet-500 text-white'
                        : 'border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Live Lobbies ({publicRooms.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('players')}
                    className={`font-display font-bold text-xs uppercase tracking-wider pb-1.5 border-b-2 transition-all cursor-pointer ${
                      activeTab === 'players'
                        ? 'border-cyan-500 text-white'
                        : 'border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Online ({challengers.length})
                  </button>
                </div>

                <button
                  onClick={handleRefresh}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Refresh social feeds"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'rooms' ? (
                  /* Tab Content 1: Live Lobbies */
                  publicRooms.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border border-violet-500/20 animate-ping opacity-60" />
                        <div className="absolute inset-2 rounded-full border border-violet-500/10 animate-pulse" />
                        <div className="w-10 h-10 rounded-full bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                          <Swords className="w-5 h-5 animate-pulse" />
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-300">Scanning for active lobbies...</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
                        No public duels available right now. Launch one to match with players!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {publicRooms.map((room) => (
                        <div
                          key={room.id}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/70 transition-all"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-white tracking-wide">
                                Tic-Tac-Toe
                              </span>
                              <span className="bg-violet-950/40 text-[10px] font-bold text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/20 uppercase tracking-widest font-mono">
                                {room.id}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Host: <span className="font-semibold text-gray-300">{room.players[0]?.username}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {room.players.length}/2
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => joinRoom(room.id)}
                              className="text-xs py-1 px-3 hover:bg-violet-600 hover:text-white cursor-pointer"
                            >
                              Join
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  /* Tab Content 2: Online Opponents */
                  challengers.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-pulse" />
                        <div className="w-10 h-10 rounded-full bg-cyan-600/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                          <Users className="w-5 h-5" />
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-300">Quiet in the Arena...</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
                        No other players online. Share your room code with a friend to play!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {challengers.map((onlineUser) => (
                        <div
                          key={onlineUser._id}
                          className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Avatar name={onlineUser.avatar} size="sm" />
                            <div className="text-left leading-tight">
                              <div className="text-xs font-bold text-gray-200">{onlineUser.username}</div>
                              <div className="text-[9px] text-cyan-400 font-semibold mt-0.5 font-mono">
                                Lvl {onlineUser.level} • {onlineUser.rating} Pts
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInvitePlayer(onlineUser._id)}
                            className="text-[10px] px-3 py-1 font-bold border-cyan-500/30 text-cyan-400 hover:bg-cyan-600 hover:text-white cursor-pointer"
                          >
                            Challenge
                          </Button>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

