'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import { useGameStore } from '../store/useGameStore';
import { Navbar } from '../components/Navbar';
import { BottomNav } from '../components/BottomNav';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';
import { Award, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const { connectSocket, room } = useGameStore();

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
    if (room) {
      router.push(`/room/${room.id}`);
    }
  }, [room, router]);

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#06070a] relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full filter blur-[120px] pointer-events-none" />
        <Loader size="lg" />
      </div>
    );
  }

  const totalGames = user.wins + user.losses + user.draws;
  const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;

  const currentXP = (user.wins * 10) + (user.draws * 3);
  const xpInCurrentLevel = currentXP % 50;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / 50) * 100));

  const availableGames = [
    { id: 'music-room', name: 'Music Party', emoji: '📻🎵', active: true, desc: 'Listen to synchronized music previews alone or in rooms with up to 5 friends!' },
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', emoji: '❌⭕', active: true, desc: 'Align 3 symbols to conquer the board.' },
    { id: 'guess-the-song', name: 'Guess The Song', emoji: '🎵🎧', active: true, desc: 'Listen to short audio previews and guess the title as fast as possible!' },
    { id: 'bingo', name: 'Bingo Tambola', emoji: '🔢🏆', active: true, desc: 'Mark numbers on a shared 5x5 board in turns and race to complete 5 lines!' },
    { id: 'chess', name: 'Chess', emoji: '👑♟️', active: false, desc: 'Classic board game of intellect. Coming soon!' },
    { id: 'connect4', name: 'Connect 4', emoji: '🔴🟡', active: false, desc: 'Drop tokens to connect 4 in a row. Coming soon!' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#090a0f] cyber-grid relative font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 md:px-6 md:py-8 flex flex-col gap-4 md:gap-8 pb-20 lg:pb-8">
        <div className="hidden md:flex glass-panel rounded-2xl md:rounded-3xl p-4 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 relative overflow-hidden shadow-xl border border-white/5 card-transition hover-glow-purple">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full filter blur-[60px] -z-10" />

          <div className="flex items-center gap-3.5 md:gap-5 text-left flex-row w-full md:w-auto">
            <Avatar name={user.avatar} size="lg" className="border-2 border-violet-500/20 shadow-lg shadow-violet-500/10" />
            <div>
              <h1 className="font-display font-extrabold text-xl md:text-2xl text-white tracking-wide flex items-center gap-2">
                Hello, {user.username}!
                <span className="text-[10px] md:text-xs bg-violet-500/20 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest font-mono">
                  Lvl {user.level}
                </span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm mt-0.5 md:mt-1 max-w-md hidden sm:block">
                Ready for another duel? Challenge online players or invite friends using private codes.
              </p>
            </div>
          </div>

          <div className="w-full md:w-64 bg-slate-950/40 border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4.5 shrink-0">
            <div className="flex justify-between items-center text-[10px] md:text-xs font-bold text-gray-400 mb-1.5 md:mb-2">
              <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-violet-400" /> LEVEL PROGRESS</span>
              <span className="text-violet-400 font-mono">{xpInCurrentLevel}/50 XP</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 md:h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[9px] md:text-[10px] text-gray-500 mt-1.5 md:mt-2 font-semibold uppercase tracking-wider text-right">
              {50 - xpInCurrentLevel} XP to Level {user.level + 1}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto w-full space-y-4 md:space-y-6">
          <div className="glass-panel rounded-2xl p-3.5 grid grid-cols-4 gap-1 text-center divide-x divide-white/5 shadow-lg select-none">
            <div className="px-1">
              <div className="text-[9px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider">Rating</div>
              <div className="text-base md:text-xl font-black text-violet-400 mt-0.5 font-mono">{user.rating}</div>
            </div>
            <div className="px-1">
              <div className="text-[9px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider">Win Rate</div>
              <div className="text-base md:text-xl font-black text-cyan-400 mt-0.5 font-mono">{winRate}%</div>
            </div>
            <div className="px-1">
              <div className="text-[9px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider">Matches</div>
              <div className="text-base md:text-xl font-black text-amber-500 mt-0.5 font-mono">{totalGames}</div>
            </div>
            <div className="px-1">
              <div className="text-[9px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider">Wins</div>
              <div className="text-base md:text-xl font-black text-emerald-400 mt-0.5 font-mono">{user.wins}</div>
            </div>
          </div>

          {/* Android APK Download Banner (Desktop only) */}
          <div className="hidden md:flex glass-panel rounded-2xl p-3.5 md:p-5 bg-gradient-to-r from-violet-950/20 to-slate-950/30 border border-violet-500/20 flex flex-row items-center justify-between gap-4 hover-glow-purple card-transition">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-violet-400 text-lg md:text-xl shrink-0">
                📱
              </div>
              <div>
                <h3 className="font-display font-bold text-sm md:text-base text-gray-200">PlayVerse Mobile</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-md hidden sm:block">
                  Download and install our mobile APK to enjoy full-screen gaming, smoother performance, and a native app experience on your phone.
                </p>
              </div>
            </div>
            <a
              href="/playverse.apk"
              download="playverse.apk"
              className="shrink-0"
            >
              <Button variant="primary" className="gap-1.5 py-1.5 px-4 md:py-2.5 md:px-6 text-xs md:text-sm font-bold cursor-pointer whitespace-nowrap">
                Download
              </Button>
            </a>
          </div>

          <div className="glass-panel rounded-2xl p-4 md:p-6">
            <h2 className="font-display font-bold text-base md:text-lg text-gray-100 mb-3 md:mb-5 tracking-wide uppercase">
              AVAILABLE GAMES
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableGames.map((game) => (
                <div
                  key={game.id}
                  className={`relative p-4 md:p-5 rounded-2xl border border-white/5 bg-slate-900/20 card-transition ${game.active
                      ? 'hover:bg-slate-900/60 hover:border-violet-500/30 hover-glow-purple'
                      : 'opacity-50'
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{game.emoji}</span>
                    {game.active ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Active
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-gray-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Soon
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-base text-gray-200">{game.name}</h3>
                  <p className="text-xs text-gray-550 mt-1.5 leading-relaxed">{game.desc}</p>
                  {game.active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 md:mt-4 p-0 text-xs md:text-sm text-violet-400 hover:text-violet-300 font-bold items-center gap-1 hover:bg-transparent cursor-pointer"
                      onClick={() => router.push(`/games/${game.id}`)}
                    >
                      Launch Duel <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
