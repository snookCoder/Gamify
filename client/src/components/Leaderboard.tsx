'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Avatar } from './ui/Avatar';
import { Trophy, Medal, RefreshCw } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { Loader } from './ui/Loader';


interface LeaderboardUser {
  _id: string;
  username: string;
  avatar: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  level: number;
}

export const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useGameStore();

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await api.users.getLeaderboard();
      setUsers(data as any);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    if (socket) {
      socket.on('stats-updated', fetchLeaderboard);
      return () => {
        socket.off('stats-updated', fetchLeaderboard);
      };
    }
  }, [socket]);

  return (
    <div className="glass-panel rounded-2xl p-4 md:p-6 flex flex-col h-full shadow-lg card-transition hover:border-violet-500/20 hover-glow-purple">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-1.5 md:gap-2">
          <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
          <h2 className="font-display font-bold text-base md:text-lg text-gray-100 tracking-wide uppercase">
            GLOBAL LEADERBOARD
          </h2>
        </div>
        <button
          onClick={fetchLeaderboard}
          className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && users.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <Loader size="sm" text="Loading ranks" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-sm text-red-400 py-10">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500 py-10">
          No records yet. Be the first!
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[400px] pr-1">
          {users.map((rankUser, index) => {
            const isTop3 = index < 3;
            const trophyColors = [
              'text-yellow-500 shadow-yellow-500/10',
              'text-slate-300 shadow-slate-300/10',
              'text-amber-600 shadow-amber-600/10',
            ];

            const textColors = [
              'text-yellow-400',
              'text-slate-300',
              'text-amber-500',
            ];

            return (
              <div
                key={rankUser._id}
                className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0 hover:bg-white/[0.01] px-2 rounded-lg transition-all"
              >
                <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                  <div className="w-6 text-center text-[10px] md:text-xs font-bold text-gray-500 flex items-center justify-center shrink-0">
                    {isTop3 ? (
                      <Medal className={`w-4 h-4 md:w-5 md:h-5 ${trophyColors[index]}`} />
                    ) : (
                      <span className="font-mono text-gray-400">#{index + 1}</span>
                    )}
                  </div>
                  <Avatar name={rankUser.avatar} size="sm" className="ring-1 ring-white/5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs md:text-sm font-bold text-gray-200 truncate max-w-[90px] sm:max-w-[120px]">{rankUser.username}</div>
                    <div className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider leading-none mt-0.5 whitespace-nowrap">
                      Lvl {rankUser.level} • {rankUser.wins}W
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-xs md:text-sm font-extrabold font-mono leading-none ${isTop3 ? textColors[index] : 'text-violet-400'}`}>{rankUser.rating}</div>
                  <div className="text-[8px] md:text-[9px] uppercase tracking-wider text-gray-500 font-bold mt-0.5">
                    PTS
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
