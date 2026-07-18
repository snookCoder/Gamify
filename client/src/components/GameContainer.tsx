'use client';

import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { useAuthStore } from '../store/useAuthStore';
import { GAME_REGISTRY } from '../games/GameRegistry';
import { AlertCircle, Timer, Trophy, Skull, HelpCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

const ConfettiRain = () => {
  const particles = Array.from({ length: 30 });
  const emojis = ['🎉', '🥳', '🏆', '✨', '🌸', '🎈', '❤️', '🌟'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-10">
      {particles.map((_, i) => {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const delay = Math.random() * 5;
        const duration = 3 + Math.random() * 3;
        const left = Math.random() * 100;
        const size = 16 + Math.random() * 20;

        return (
          <motion.div
            key={i}
            initial={{ y: '110%', x: `${left}%`, rotate: 0, opacity: 1 }}
            animate={{ 
              y: '-10%', 
              x: `${left + (Math.random() * 20 - 10)}%`,
              rotate: 360,
              opacity: [1, 1, 0.8, 0] 
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="absolute font-sans"
            style={{ fontSize: size }}
          >
            {emoji}
          </motion.div>
        );
      })}
    </div>
  );
};

const SadRain = () => {
  const particles = Array.from({ length: 20 });
  const emojis = ['😭', '💔', '🌧️', '💀', '👎', '💧'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-10">
      {particles.map((_, i) => {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const delay = Math.random() * 4;
        const duration = 4 + Math.random() * 3;
        const left = Math.random() * 100;
        const size = 16 + Math.random() * 16;

        return (
          <motion.div
            key={i}
            initial={{ y: '-10%', x: `${left}%`, rotate: 0, opacity: 1 }}
            animate={{ 
              y: '110%', 
              x: `${left + (Math.random() * 10 - 5)}%`,
              rotate: 180,
              opacity: [1, 1, 0.7, 0] 
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="absolute font-sans"
            style={{ fontSize: size }}
          >
            {emoji}
          </motion.div>
        );
      })}
    </div>
  );
};

export const GameContainer: React.FC = () => {
  const { room, makeMove, playAgain } = useGameStore();
  const { user } = useAuthStore();

  if (!room || !room.gameState || !user) return null;

  const GameComponent = GAME_REGISTRY[room.game];
  const isSpectator = !room.players.some((p) => p.id === user.id);

  let statusText = '';
  const isMyTurn = room.gameState.turn === user.id;
  const currentTurnPlayer = room.players.find((p) => p.id === room.gameState?.turn);

  if (room.gameState.status === 'playing') {
    if (isSpectator) {
      statusText = `Spectating: ${currentTurnPlayer?.username}'s turn`;
    } else {
      statusText = isMyTurn ? "Your turn! Make a move." : `Waiting for ${currentTurnPlayer?.username}...`;
    }
  } else if (room.gameState.status === 'gameover') {
    const winnerId = room.gameState.winner;
    if (winnerId === 'draw') {
      statusText = "It's a draw! Well played.";
    } else if (winnerId === user.id) {
      statusText = "🎉 Victory! You won (+10 Pts)!";
    } else {
      const winnerName = room.players.find((p) => p.id === winnerId)?.username || 'Opponent';
      statusText = `💀 Defeat! ${winnerName} won the match.`;
    }
  }

  return (
    <div className="flex flex-col items-center w-full relative">
      <div className="w-full flex items-center justify-between px-6 py-4 bg-slate-950/30 border-b border-white/5 select-none mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center bg-slate-900 border border-white/5 rounded-xl px-4 py-2 text-sm font-bold text-gray-200">
            {room.game === 'tic-tac-toe' ? 'Tic-Tac-Toe' : room.game === 'bingo' ? 'Bingo Tambola' : room.game === 'guess-the-song' ? 'Guess The Song' : room.game}
          </div>
          <span className="text-sm font-semibold text-gray-400">{statusText}</span>
        </div>

        {room.gameState.status === 'playing' && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${
              room.turnTimeLeft <= 10
                ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                : 'bg-slate-900/60 border-white/5 text-violet-400'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>{room.turnTimeLeft}s</span>
          </div>
        )}
      </div>

      <div className="w-full flex flex-col items-center">
        {GameComponent ? (
          <GameComponent
            board={room.gameState.board}
            makeMove={makeMove}
            turn={room.gameState.turn}
            myUserId={user.id}
            players={room.players}
            winner={room.gameState.winner}
            winningSequence={room.gameState.winningSequence}
          />
        ) : (
          <div className="flex flex-col items-center py-20 text-gray-400 text-center">
            <AlertCircle className="w-12 h-12 text-violet-500/50 mb-3" />
            <h3 className="text-lg font-bold text-gray-200">Coming Soon!</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-[280px]">
              This game is currently in development. Tic-Tac-Toe is active!
            </p>
          </div>
        )}
      </div>

      {room.gameState.status === 'gameover' && !isSpectator && (
        <AnimatePresence>
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            {room.gameState.winner === user.id ? (
              <ConfettiRain />
            ) : room.gameState.winner !== 'draw' ? (
              <SadRain />
            ) : null}

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl relative z-10 border text-center ${
                room.gameState.winner === user.id
                  ? 'glass-panel-glow-purple bg-gradient-to-b from-violet-950/20 to-slate-950/90 border-violet-500/10'
                  : room.gameState.winner === 'draw'
                  ? 'bg-slate-950/90 border-white/5'
                  : 'bg-gradient-to-b from-red-950/15 to-slate-950/90 border-red-500/10'
              }`}
            >
              <div className="flex justify-center mb-4">
                {room.gameState.winner === user.id ? (
                  <div className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 p-4 rounded-full animate-bounce">
                    <Trophy className="w-10 h-10" />
                  </div>
                ) : room.gameState.winner === 'draw' ? (
                  <div className="bg-slate-800 text-slate-300 border border-slate-700/20 p-4 rounded-full">
                    <HelpCircle className="w-10 h-10" />
                  </div>
                ) : (
                  <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-full">
                    <Skull className="w-10 h-10" />
                  </div>
                )}
              </div>

              <h2 className="font-display font-black text-xl tracking-wider text-white uppercase">
                {room.gameState.winner === user.id ? (
                  <span>VICTORY! 🎉</span>
                ) : room.gameState.winner === 'draw' ? (
                  <span>IT'S A DRAW! 🤝</span>
                ) : (
                  <span>Better luck next time! 💀</span>
                )}
              </h2>

              <div className="mt-4 py-2.5 px-4 bg-slate-950/40 rounded-2xl border border-white/5 inline-block text-xs font-bold text-gray-300">
                {room.gameState.winner === user.id ? (
                  <span className="text-emerald-400 font-mono">+10 Pts • +50 Coins 🪙</span>
                ) : room.gameState.winner === 'draw' ? (
                  <span className="text-amber-400 font-mono">+3 Pts • 0 Coins 🪙</span>
                ) : (
                  <span className="text-red-400 font-mono">+0 Pts • -50 Coins 🪙</span>
                )}
              </div>

              {(() => {
                const myUserId = user.id;
                const opponent = room.players.find(p => p.id !== user.id);
                const didIRequest = room.rematchRequests?.includes(myUserId);
                const didOpponentRequest = room.rematchRequests?.includes(opponent?.id || '');

                return (
                  <div className="mt-8 flex flex-col items-stretch gap-3">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">
                      {didIRequest && !didOpponentRequest ? (
                        <span className="text-violet-400 animate-pulse">Rematch request sent... ⏳</span>
                      ) : didOpponentRequest && !didIRequest ? (
                        <span className="text-amber-400 animate-bounce">Opponent requested a rematch!</span>
                      ) : (
                        <span>Ready for another round?</span>
                      )}
                    </div>

                    <div className="flex gap-2.5">
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => useGameStore.getState().leaveRoom()}
                        className="py-2.5 text-xs font-bold cursor-pointer"
                      >
                        Exit Room
                      </Button>
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={playAgain}
                        disabled={didIRequest}
                        className="py-2.5 text-xs font-bold animate-pulse-glow cursor-pointer"
                      >
                        {didOpponentRequest ? 'Accept Rematch ⚔️' : didIRequest ? 'Requested...' : 'Rematch ⚔️'}
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};
