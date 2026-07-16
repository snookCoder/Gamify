'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useGameStore } from '../../store/useGameStore';
import { api } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { Avatar } from '../../components/ui/Avatar';
import { BottomNav } from '../../components/BottomNav';
import { History } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const { connectSocket } = useGameStore();

  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [mounted, setMounted] = useState(false);

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

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#090a0f] cyber-grid relative font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 md:px-6 md:py-8 flex flex-col gap-4 pb-20 lg:pb-8">
        <div className="max-w-3xl mx-auto w-full">
          <div className="glass-panel rounded-2xl p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <History className="w-5 h-5 text-gray-400" />
              <h2 className="font-display font-bold text-lg text-gray-100 tracking-wide uppercase">
                FULL MATCH HISTORY
              </h2>
            </div>

            {loadingMatches ? (
              <div className="text-sm text-gray-500 text-center py-10">Loading logs...</div>
            ) : matches.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-10 border border-dashed border-white/5 rounded-xl bg-slate-900/10">
                No matches played yet. Start a duel to populate history!
              </div>
            ) : (
              <div className="space-y-2.5">
                {matches.map((match) => {
                  const opponent = match.players.find((p: any) => p._id !== user.id);
                  const isDraw = !match.winner;
                  const isWinner = match.winner?._id === user.id || match.winner === user.id;

                  const ringColor = isDraw
                    ? 'ring-2 ring-amber-500/30'
                    : isWinner
                    ? 'ring-2 ring-emerald-500/30'
                    : 'ring-2 ring-rose-500/30';

                  return (
                    <div
                      key={match._id}
                      className="flex items-center justify-between py-3.5 border-b border-white/5 last:border-b-0 hover:bg-white/[0.01] px-2 rounded-lg transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={opponent?.avatar || 'avatar_1'} size="sm" className={`ring-offset-2 ring-offset-slate-950 ${ringColor}`} />
                        <div>
                          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <span className="font-display text-violet-400 font-bold">
                              {match.game === 'tic-tac-toe' ? '❌⭕ Tic-Tac-Toe' : match.game === 'guess-the-song' ? '🎵 Guess Song' : match.game}
                            </span>
                            <span className="text-gray-700">•</span>
                            <span className="font-mono text-gray-500 font-normal">
                              {new Date(match.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-gray-200 mt-0.5">
                            vs {opponent?.username || 'Opponent'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[9px] md:text-[10px] font-display font-black tracking-widest uppercase px-2.5 py-1 rounded border font-mono shadow-md ${
                            isDraw
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : isWinner
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}
                        >
                          {isDraw ? 'Draw' : isWinner ? 'Victory' : 'Defeat'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
