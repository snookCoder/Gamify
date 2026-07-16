'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useGameStore } from '../../store/useGameStore';
import { Navbar } from '../../components/Navbar';
import { Leaderboard } from '../../components/Leaderboard';
import { BottomNav } from '../../components/BottomNav';

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const { connectSocket } = useGameStore();
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
          <Leaderboard />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
