'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/useAuthStore';
import { useGameStore } from '../../../store/useGameStore';
import { Navbar } from '../../../components/Navbar';
import { ActiveRooms } from '../../../components/ActiveRooms';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft, Users, Gamepad2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TicTacToeLobby() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const { connectSocket, room, onlineUsers, createRoom, sendInvite, refreshLobby } = useGameStore();

  const [pendingInviteUserId, setPendingInviteUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  return (
    <div className="flex flex-col min-h-screen bg-[#090a0f] cyber-grid relative">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Header Block */}
        <div className="flex flex-col gap-4">
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

          <div className="glass-panel rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl border border-white/5 card-transition hover-glow-purple">
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full filter blur-[60px] -z-10" />
            
            <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-2xl flex items-center justify-center border border-violet-400/20 shadow-lg shadow-violet-500/20">
                <span className="text-3xl">❌⭕</span>
              </div>
              <div>
                <h1 className="font-display font-extrabold text-2xl text-white tracking-wide">
                  Tic-Tac-Toe Arena
                </h1>
                <p className="text-gray-400 text-sm mt-1 max-w-xl">
                  Challenge online players in real-time or create custom rooms to play with friends. Bet 50 coins to start!
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <Button
                variant="primary"
                onClick={() => createRoom('tic-tac-toe', false)}
                className="flex-1 md:flex-none shadow-lg shadow-violet-500/20 cursor-pointer"
              >
                Create Room
              </Button>
              <Button
                variant="outline"
                onClick={() => createRoom('tic-tac-toe', true)}
                className="flex-1 md:flex-none cursor-pointer"
              >
                Create Private Room
              </Button>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left / Center Lobbies */}
          <div className="lg:col-span-2">
            <ActiveRooms />
          </div>

          {/* Right Lobby Sidebar */}
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 flex flex-col shadow-lg card-transition hover:border-violet-500/20 hover-glow-purple">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-lg text-gray-100 tracking-wide uppercase">
                    Online Opponents
                  </h2>
                  <button
                    onClick={handleRefresh}
                    className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title="Refresh Players"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                  {onlineUsers.filter((u) => u._id !== user.id).length} Online
                </span>
              </div>

              {onlineUsers.filter((u) => u._id !== user.id).length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-8 border border-dashed border-white/5 rounded-xl bg-slate-900/10">
                  No other players online right now. Invite a friend by sharing a room code!
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {onlineUsers
                    .filter((u) => u._id !== user.id)
                    .map((onlineUser) => (
                      <div
                        key={onlineUser._id}
                        className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar name={onlineUser.avatar} size="sm" />
                          <div className="text-left leading-tight">
                            <div className="text-xs font-bold text-gray-200">{onlineUser.username}</div>
                            <div className="text-[9px] text-violet-400 font-semibold mt-0.5 font-mono">
                              Lvl {onlineUser.level} • {onlineUser.rating} Pts
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInvitePlayer(onlineUser._id)}
                          className="text-[10px] px-3 py-1 font-bold border-violet-500/30 text-violet-400 hover:bg-violet-600 hover:text-white cursor-pointer"
                        >
                          Challenge
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
