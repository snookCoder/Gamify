'use client';

import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

export const GlobalErrorModal: React.FC = () => {
  const { error, clearError } = useGameStore();

  return (
    <AnimatePresence>
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={clearError}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="w-full max-w-sm bg-slate-900/90 border border-red-500/20 rounded-3xl p-6 shadow-2xl relative z-10 text-center"
            style={{
              boxShadow: '0 0 40px -10px rgba(239, 68, 68, 0.15)',
            }}
          >
            <div className="flex justify-center mb-4">
              <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-3.5 rounded-full animate-pulse">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-2">
              Action Restricted
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              {error}
            </p>
            <Button
              variant="outline"
              onClick={clearError}
              className="px-6 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white cursor-pointer font-bold w-full"
            >
              Acknowledge
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
