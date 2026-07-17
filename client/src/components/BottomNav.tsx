'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { History, Trophy, Gamepad2, MessageSquare } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { unreadPrivateCount } = useGameStore();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#07080c]/90 backdrop-blur-lg border-t border-white/10 py-2 px-3 flex justify-around items-center shadow-[0_-8px_30px_rgba(0,0,0,0.8)] pb-safe-bottom">
      <Link
        href="/"
        className="flex flex-col items-center gap-1 cursor-pointer relative py-1 px-2.5 min-w-[65px] select-none"
      >
        <div className={`p-2 rounded-2xl transition-all duration-300 ${
          pathname === '/'
            ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.25)] scale-110'
            : 'text-gray-450 hover:text-gray-200 border border-transparent'
        }`}>
          <Gamepad2 className="w-5.5 h-5.5" />
        </div>
        <span className={`text-[9px] font-display font-black tracking-wider transition-colors ${
          pathname === '/' ? 'text-violet-400' : 'text-gray-500'
        }`}>
          LOBBY
        </span>
      </Link>

      <Link
        href="/chats"
        className="flex flex-col items-center gap-1 cursor-pointer relative py-1 px-2.5 min-w-[65px] select-none"
      >
        <div className="relative">
          <div className={`p-2 rounded-2xl transition-all duration-300 ${
            pathname === '/chats'
              ? 'bg-emerald-500/20 text-emerald-450 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.25)] scale-110'
              : 'text-gray-450 hover:text-gray-200 border border-transparent'
          }`}>
            <MessageSquare className="w-5.5 h-5.5" />
          </div>
          {unreadPrivateCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[8px] font-black text-white border border-[#07080c] shadow-sm animate-pulse">
              {unreadPrivateCount}
            </span>
          )}
        </div>
        <span className={`text-[9px] font-display font-black tracking-wider transition-colors ${
          pathname === '/chats' ? 'text-emerald-450' : 'text-gray-500'
        }`}>
          CHATS
        </span>
      </Link>

      <Link
        href="/history"
        className="flex flex-col items-center gap-1 cursor-pointer relative py-1 px-2.5 min-w-[65px] select-none"
      >
        <div className={`p-2 rounded-2xl transition-all duration-300 ${
          pathname === '/history'
            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.25)] scale-110'
            : 'text-gray-450 hover:text-gray-200 border border-transparent'
        }`}>
          <History className="w-5.5 h-5.5" />
        </div>
        <span className={`text-[9px] font-display font-black tracking-wider transition-colors ${
          pathname === '/history' ? 'text-cyan-400' : 'text-gray-500'
        }`}>
          RECENT
        </span>
      </Link>

      <Link
        href="/leaderboard"
        className="flex flex-col items-center gap-1 cursor-pointer relative py-1 px-2.5 min-w-[65px] select-none"
      >
        <div className={`p-2 rounded-2xl transition-all duration-300 ${
          pathname === '/leaderboard'
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-110'
            : 'text-gray-450 hover:text-gray-200 border border-transparent'
        }`}>
          <Trophy className="w-5.5 h-5.5" />
        </div>
        <span className={`text-[9px] font-display font-black tracking-wider transition-colors ${
          pathname === '/leaderboard' ? 'text-amber-400' : 'text-gray-500'
        }`}>
          RANKS
        </span>
      </Link>
    </div>
  );
};
