'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../store/useGameStore';
import { useAuthStore } from '../store/useAuthStore';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

export const InviteModal: React.FC = () => {
  const router = useRouter();
  const { activeInvite, acceptInvite, declineInvite } = useGameStore();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !activeInvite) return null;

  const handleAccept = () => {
    acceptInvite((roomCode) => {
      router.push(`/room/${roomCode}`);
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={declineInvite}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl glass-panel-glow-purple border border-white/5 relative z-10 text-center"
        >
          <div className="flex flex-col items-center">
            <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
              ⚔️ Duel Invitation
            </span>

            <Avatar name={activeInvite.sender.avatar} size="lg" className="border-2 border-violet-500/20 mb-3" />
            
            <h3 className="font-display font-extrabold text-lg text-white">
              {activeInvite.sender.username}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Rating: <span className="font-bold text-gray-200">{activeInvite.sender.rating} Pts</span>
            </p>

            <p className="text-sm text-gray-300 mt-5 leading-relaxed">
              Invited you to a match of{' '}
              <span className="font-bold text-violet-400">
                {activeInvite.game === 'tic-tac-toe' ? 'Tic-Tac-Toe' : activeInvite.game}
              </span>
            </p>

            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <Button
                variant="secondary"
                onClick={declineInvite}
                className="gap-1.5 py-2.5 text-xs font-bold cursor-pointer"
              >
                <X className="w-4 h-4" /> Decline
              </Button>
              <Button
                variant="primary"
                onClick={handleAccept}
                className="gap-1.5 py-2.5 text-xs font-bold animate-pulse-glow cursor-pointer"
              >
                <Check className="w-4 h-4" /> Accept
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
