'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { History, Trophy, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#07080c]/95 backdrop-blur-md border-t border-white/5 py-3 px-8 flex justify-around items-center shadow-[0_-5px_25px_rgba(0,0,0,0.6)]">
      <Link
        href="/"
        className={`relative p-2.5 rounded-xl transition-all ${
          pathname === '/' ? 'text-violet-400 scale-110 font-bold' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        {pathname === '/' && (
          <motion.div
            layoutId="mobileActiveTabGlow"
            className="absolute inset-0 bg-violet-500/10 border border-violet-500/20 rounded-xl -z-10 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <Gamepad2 className="w-5 h-5" />
      </Link>

      <Link
        href="/history"
        className={`relative p-2.5 rounded-xl transition-all ${
          pathname === '/history' ? 'text-violet-400 scale-110 font-bold' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        {pathname === '/history' && (
          <motion.div
            layoutId="mobileActiveTabGlow"
            className="absolute inset-0 bg-violet-500/10 border border-violet-500/20 rounded-xl -z-10 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <History className="w-5 h-5" />
      </Link>

      <Link
        href="/leaderboard"
        className={`relative p-2.5 rounded-xl transition-all ${
          pathname === '/leaderboard' ? 'text-violet-400 scale-110 font-bold' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        {pathname === '/leaderboard' && (
          <motion.div
            layoutId="mobileActiveTabGlow"
            className="absolute inset-0 bg-violet-500/10 border border-violet-500/20 rounded-xl -z-10 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
        <Trophy className="w-5 h-5" />
      </Link>
    </div>
  );
};
