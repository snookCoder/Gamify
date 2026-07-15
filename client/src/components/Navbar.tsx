'use client';

import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { LogOut, Trophy, Award, Coins } from 'lucide-react';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAuthenticated || !user) return null;

  return (
    <nav className="bg-[#07080c] border-b border-white/5 sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between shadow-lg shadow-black/40">
      <Link href="/" className="flex items-center gap-2 select-none group">
        <span className="bg-gradient-to-r from-violet-600 to-indigo-600 p-2 rounded-lg text-white shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
          🎮
        </span>
        <span className="font-display font-extrabold text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-violet-400 group-hover:to-violet-300 transition-colors">
          PLAYVERSE
        </span>
      </Link>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-4 bg-slate-950/40 border border-white/5 rounded-full px-4 py-1.5 text-xs text-gray-400 select-none">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            <span className="font-bold text-gray-200">{user.rating}</span> <span className="text-[10px] tracking-wider uppercase text-gray-500">Rating</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-gray-200">Lv.{user.level}</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold text-gray-200">{user.coins}</span> <span className="text-[10px] tracking-wider uppercase text-gray-500">Coins</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={user.avatar} size="sm" />
            <div className="text-left leading-tight hidden sm:block">
              <div className="text-sm font-bold text-gray-200">{user.username}</div>
              <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Online</div>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={logout} title="Log Out" className="p-2 min-w-0">
            <LogOut className="w-4 h-4 text-gray-400 hover:text-red-400 transition-colors" />
          </Button>
        </div>
      </div>
    </nav>
  );
};
