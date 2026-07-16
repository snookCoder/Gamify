'use client';

import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { LogOut, Trophy, Award, Coins, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAuthenticated || !user) return null;

  const currentXP = (user.wins * 10) + (user.draws * 3);
  const xpInCurrentLevel = currentXP % 50;

  return (
    <nav className="bg-[#07080c] border-b border-white/5 sticky top-0 z-50 px-4 md:px-6 py-3 flex items-center justify-between shadow-lg shadow-black/40">
      <Link href="/" className="flex items-center gap-2 select-none group shrink-0">
        <span className="hidden sm:flex bg-gradient-to-r from-violet-600 to-indigo-600 p-2 rounded-lg text-white shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
          🎮
        </span>
        <span className="font-display font-extrabold text-sm sm:text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-violet-400 group-hover:to-violet-300 transition-colors">
          PLAYVERSE
        </span>
      </Link>

      <div className="flex items-center gap-2 md:gap-6 ml-auto mr-2 md:mr-0 min-w-0">
        {/* Desktop user stats */}
        <div className="hidden md:flex items-center gap-4 bg-slate-950/40 border border-white/5 rounded-full px-4 py-1.5 text-xs text-gray-400 select-none">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            <span className="font-bold text-gray-200">{user.rating}</span> <span className="text-[10px] tracking-wider uppercase text-gray-500">Rating</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-gray-200">Lv.{user.level}</span>
            <span className="text-[9px] text-gray-500 font-mono ml-0.5">({xpInCurrentLevel}/50 XP)</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold text-gray-200">{user.coins}</span> <span className="text-[10px] tracking-wider uppercase text-gray-500">Coins</span>
          </div>
        </div>

        {/* Mobile user stats: Coins, XP/Lvl */}
        <div className="flex md:hidden items-center gap-1.5 bg-slate-950/50 border border-white/5 rounded-full px-2.5 py-1 text-[9px] text-gray-400 select-none font-mono min-w-0">
          <div className="flex items-center gap-0.5 shrink-0">
            <Coins className="w-2.5 h-2.5 text-amber-500" />
            <span className="font-bold text-gray-200">{user.coins}</span>
          </div>
          <div className="w-px h-2 bg-white/10 shrink-0" />
          <div className="flex items-center gap-0.5 shrink-0">
            <Award className="w-2.5 h-2.5 text-cyan-400" />
            <span className="font-bold text-gray-200">L.{user.level}</span>
            <span className="text-[8px] text-gray-500">({xpInCurrentLevel}XP)</span>
          </div>
        </div>

        <div className="relative shrink-0 flex items-center">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="relative flex items-center justify-center rounded-full shrink-0 cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-md border border-violet-400/20 select-none uppercase shrink-0">
              {user.username.charAt(0)}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-[#07080c] rounded-full animate-pulse" />
          </button>

          {/* Profile Dropdown / Mobile Drawer */}
          {isProfileOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:bg-transparent md:backdrop-blur-none"
                onClick={() => setIsProfileOpen(false)}
              />
              <div
                className="fixed right-0 top-0 bottom-0 w-72 z-50 bg-[#08090d]/98 border-l border-white/5 p-6 shadow-2xl flex flex-col justify-between
                           md:absolute md:top-full md:right-0 md:bottom-auto md:w-64 md:border md:rounded-2xl md:mt-2 md:p-4.5 md:shadow-violet-500/5 md:bg-[#08090d]"
              >
                {/* Header info */}
                <div>
                  <div className="flex items-center justify-between md:hidden mb-4">
                    <span className="font-display font-extrabold text-sm uppercase tracking-wider text-gray-400">Profile Menu</span>
                    <button onClick={() => setIsProfileOpen(false)} className="text-gray-500 hover:text-white text-xs font-mono">CLOSE ✕</button>
                  </div>

                  <div className="flex items-center gap-3.5 mb-6 md:mb-4">
                    <Avatar name={user.avatar} size="md" className="border border-violet-500/20 shadow-lg shadow-violet-500/10" />
                    <div>
                      <div className="font-display font-extrabold text-gray-200 text-base leading-tight">{user.username}</div>
                      <div className="text-[10px] text-emerald-400 font-semibold tracking-wide uppercase mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-white/5 my-4" />

                  {/* Detailed Stats in Drawer */}
                  <div className="space-y-3 font-sans">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Rating:</span>
                      <span className="font-bold text-violet-400 font-mono">{user.rating} PTS</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Coins:</span>
                      <span className="font-bold text-amber-500 font-mono">🪙 {user.coins}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Level:</span>
                      <span className="font-bold text-cyan-400 font-mono">Lv. {user.level}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>XP Progress:</span>
                      <span className="font-bold text-gray-300 font-mono">{xpInCurrentLevel}/50 XP</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>W-D-L Record:</span>
                      <span className="font-bold text-gray-400 font-mono">{user.wins}W - {user.draws}D - {user.losses}L</span>
                    </div>
                  </div>
                </div>

                {/* Logout Action */}
                <div className="mt-8 md:mt-4">
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="gap-2 py-2 text-xs md:text-sm font-bold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
