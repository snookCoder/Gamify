'use client';

import React from 'react';
import { useLoadingStore } from '../store/useLoadingStore';
import { Loader } from './ui/Loader';
import { AnimatePresence, motion } from 'framer-motion';

export const GlobalLoader: React.FC = () => {
  const { isLoading, loadingText } = useLoadingStore();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#06070a] select-none"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full filter blur-[120px] pointer-events-none" />
          <Loader size="lg" text={loadingText} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
