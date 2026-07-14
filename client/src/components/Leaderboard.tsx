'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Avatar } from './ui/Avatar';
import { Trophy, Medal, RefreshCw } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

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
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full shadow-lg card-transition hover:border-violet-500/20 hover-glow-purple">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="font-display font-bold text-lg text-gray-100 tracking-wide">
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
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500 py-10">
          Loading ranks...
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

            return (
              <div
                key={rankUser._id}
                className={`flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-900/30 hover:bg-slate-900/60 transition-all ${
                  isTop3 ? 'bg-gradient-to-r from-violet-950/20 to-transparent border-violet-500/10' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 text-center text-xs font-bold text-gray-500">
                    {isTop3 ? (
                      <Medal className={`w-5 h-5 mx-auto ${trophyColors[index]}`} />
                    ) : (
                      `#${index + 1}`
                    )}
                  </div>
                  <Avatar name={rankUser.avatar} size="sm" />
                  <div>
                    <div className="text-sm font-bold text-gray-200">{rankUser.username}</div>
                    <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                      Lvl {rankUser.level} • {rankUser.wins}W - {rankUser.losses}L
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-violet-400">{rankUser.rating}</div>
                  <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">
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
