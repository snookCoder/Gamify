'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import { useGameStore } from '../store/useGameStore';
import { api } from '../services/api';
import { Navbar } from '../components/Navbar';
import { Leaderboard } from '../components/Leaderboard';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Award, History, ArrowRight, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const { connectSocket, room } = useGameStore();

  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

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

  useEffect(() => {
    if (isAuthenticated) {
      const fetchHistory = async () => {
        try {
          setLoadingMatches(true);
          const data = await api.users.getMatchHistory();
          setMatches(data as any);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingMatches(false);
        }
      };
      fetchHistory();
    }
  }, [isAuthenticated]);

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

  const totalGames = user.wins + user.losses + user.draws;
  const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;
  
  const currentXP = (user.wins * 10) + (user.draws * 3);
  const xpInCurrentLevel = currentXP % 50;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / 50) * 100));

  const availableGames = [
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', emoji: '❌⭕', active: true, desc: 'Align 3 symbols to conquer the board.' },
    { id: 'chess', name: 'Chess', emoji: '👑♟️', active: false, desc: 'Classic board game of intellect. Coming soon!' },
    { id: 'connect4', name: 'Connect 4', emoji: '🔴🟡', active: false, desc: 'Drop tokens to connect 4 in a row. Coming soon!' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#090a0f] cyber-grid relative">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
        <div className="glass-panel rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl border border-white/5 card-transition hover-glow-purple">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full filter blur-[60px] -z-10" />
          
          <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
            <Avatar name={user.avatar} size="lg" className="border-2 border-violet-500/20 shadow-lg shadow-violet-500/10" />
            <div>
              <h1 className="font-display font-extrabold text-2xl text-white tracking-wide flex items-center gap-2 justify-center md:justify-start">
                Hello, {user.username}!
                <span className="text-xs bg-violet-500/20 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest font-mono">
                  Lvl {user.level}
                </span>
              </h1>
              <p className="text-gray-400 text-sm mt-1 max-w-md">
                Ready for another duel? Challenge online players or invite friends using private codes.
              </p>
            </div>
          </div>

          <div className="w-full md:w-64 bg-slate-950/40 border border-white/5 rounded-2xl p-4.5 shrink-0">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 mb-2">
              <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-violet-400" /> LEVEL PROGRESS</span>
              <span className="text-violet-400 font-mono">{xpInCurrentLevel}/50 XP</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-500 mt-2 font-semibold uppercase tracking-wider text-right">
              {50 - xpInCurrentLevel} XP to Level {user.level + 1}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="space-y-6 lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-panel rounded-2xl p-4 text-center border-l-2 border-l-violet-500/50 card-transition hover-glow-purple">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rating</div>
                <div className="text-2xl font-black text-violet-400 mt-1 font-mono">{user.rating}</div>
              </div>
              <div className="glass-panel rounded-2xl p-4 text-center border-l-2 border-l-cyan-500/50 card-transition hover-glow-cyan">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Win Rate</div>
                <div className="text-2xl font-black text-cyan-400 mt-1 font-mono">{winRate}%</div>
              </div>
              <div className="glass-panel rounded-2xl p-4 text-center border-l-2 border-l-amber-500/50 card-transition hover-glow-amber">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Matches</div>
                <div className="text-2xl font-black text-amber-500 mt-1 font-mono">{totalGames}</div>
              </div>
              <div className="glass-panel rounded-2xl p-4 text-center border-l-2 border-l-emerald-500/50 card-transition hover-glow-emerald">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Wins</div>
                <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{user.wins}</div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6">
              <h2 className="font-display font-bold text-lg text-gray-100 mb-5 tracking-wide uppercase">
                AVAILABLE GAMES
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableGames.map((game) => (
                  <div
                    key={game.id}
                    className={`relative p-5 rounded-2xl border border-white/5 bg-slate-900/20 card-transition ${
                      game.active
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
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{game.desc}</p>
                    {game.active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 p-0 text-violet-400 hover:text-violet-300 font-bold items-center gap-1 hover:bg-transparent cursor-pointer"
                        onClick={() => router.push(game.id === 'tic-tac-toe' ? '/games/tic-tac-toe' : '#')}
                      >
                        Launch Duel <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <History className="w-5 h-5 text-gray-400" />
                <h2 className="font-display font-bold text-lg text-gray-100 tracking-wide uppercase">
                  RECENT MATCHES
                </h2>
              </div>

              {loadingMatches ? (
                <div className="text-sm text-gray-500 text-center py-6">Loading logs...</div>
              ) : matches.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-6 border border-dashed border-white/5 rounded-xl bg-slate-900/10">
                  No matches played yet. Start a duel to populate history!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {matches.map((match) => {
                    const opponent = match.players.find((p: any) => p._id !== user.id);
                    const isDraw = !match.winner;
                    const isWinner = match.winner?._id === user.id || match.winner === user.id;

                    return (
                      <div
                        key={match._id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-slate-900/20"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={opponent?.avatar || 'avatar_1'} size="sm" />
                          <div>
                            <div className="text-sm font-bold text-gray-200">
                              vs {opponent?.username || 'Opponent'}
                            </div>
                            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5 font-mono">
                              {match.game === 'tic-tac-toe' ? 'Tic-Tac-Toe' : match.game} •{' '}
                              {new Date(match.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border font-mono ${
                              isDraw
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                : isWinner
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}
                          >
                            {isDraw ? 'Draw' : isWinner ? 'Win' : 'Loss'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Leaderboard />
          </div>
        </div>
      </main>
    </div>
  );
}
