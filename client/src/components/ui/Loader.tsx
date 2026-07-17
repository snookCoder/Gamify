'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';

interface LoaderProps {
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loader: React.FC<LoaderProps> = ({
  text = 'PlayVerse',
  className = '',
  size = 'lg',
}) => {
  const isSmall = size === 'sm';
  const isMedium = size === 'md';

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <div className={`relative flex items-center justify-center ${isSmall ? 'w-12 h-12 mb-2' : isMedium ? 'w-16 h-16 mb-4' : 'w-24 h-24 mb-6'}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-violet-500/40"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-2 rounded-full border-2 border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
        />
        <div className={`${isSmall ? 'w-7 h-7 rounded-lg' : isMedium ? 'w-10 h-10 rounded-xl' : 'w-14 h-14 rounded-2xl'} bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center border border-violet-400/20 shadow-lg shadow-violet-500/20`}>
          <Gamepad2 className={`${isSmall ? 'w-3.5 h-3.5' : isMedium ? 'w-5 h-5' : 'w-7 h-7'} text-white`} />
        </div>
      </div>
      <h1 className={`font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-white to-cyan-400 tracking-[0.25em] pl-[0.25em] uppercase ${isSmall ? 'text-[10px]' : isMedium ? 'text-xs' : 'text-xl'}`}>
        {text}
      </h1>
    </div>
  );
};
