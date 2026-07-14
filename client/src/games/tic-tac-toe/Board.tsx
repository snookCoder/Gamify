'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BoardProps {
  board: (string | null)[];
  makeMove: (payload: any) => void;
  turn: string;
  myUserId: string;
  players: { id: string; username: string; symbol?: string }[];
  winner: string | null;
  winningSequence?: number[];
}

export default function TicTacToeBoard({
  board,
  makeMove,
  turn,
  myUserId,
  players,
  winner,
  winningSequence = [],
}: BoardProps) {
  const isMyTurn = turn === myUserId && !winner;

  const handleClick = (index: number) => {
    if (isMyTurn && board[index] === null) {
      makeMove(index);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <div className="relative grid grid-cols-3 gap-3 w-full max-w-[320px] aspect-square p-3 bg-slate-950/50 rounded-2xl border border-white/5 shadow-inner">
        {board.map((cell, idx) => {
          const isWinningCell = winningSequence.includes(idx);
          const isCellEmpty = cell === null;

          return (
            <button
              key={idx}
              disabled={!isMyTurn || !isCellEmpty}
              onClick={() => handleClick(idx)}
              className={`relative flex items-center justify-center rounded-xl bg-slate-900/60 border border-white/5 aspect-square text-4xl font-extrabold focus:outline-none transition-all select-none ${
                isMyTurn && isCellEmpty
                  ? 'hover:bg-slate-800/80 hover:border-violet-500/30 cursor-pointer'
                  : ''
              } ${
                isWinningCell
                  ? 'bg-gradient-to-br from-violet-900/40 to-indigo-900/40 border-violet-500 shadow-lg shadow-violet-500/20 text-white animate-pulse'
                  : ''
              }`}
            >
              <AnimatePresence mode="wait">
                {cell && (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`${
                      cell === 'X' ? 'text-cyan-400 font-display' : 'text-amber-500 font-display'
                    }`}
                  >
                    {cell}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </div>
  );
}
