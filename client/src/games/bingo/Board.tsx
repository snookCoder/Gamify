'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Maximize2, Minimize2, Trophy, Clock, Check, AlertTriangle } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

interface RoomPlayer {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  socketId: string;
  isReady: boolean;
  symbol?: string;
}

interface BoardProps {
  board: {
    grid: { number: number; marked: boolean }[];
    scores: Record<string, number>;
    completedLines: number[][];
  };
  makeMove: (payload: any) => void;
  turn: string;
  myUserId: string;
  players: RoomPlayer[];
  winner: string | null;
  winningSequence?: number[][];
}

// Custom Synth Sound Player using Web Audio API
class BingoAudioSynth {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playTileClick() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880.00, this.ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playTurnChange() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(329.63, this.ctx.currentTime); // E4
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playTickWarning() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playLineComplete() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(261.63, now); // C4
    osc1.frequency.exponentialRampToValueAtTime(523.25, now + 0.4); // C5

    osc2.frequency.setValueAtTime(329.63, now); // E4
    osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.4); // E5

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.start();
    osc2.start();
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }

  playVictory() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      
      gain.gain.setValueAtTime(0.1, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.25);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.25);
    });
  }
}

const synth = new BingoAudioSynth();

export default function BingoBoard({
  board,
  makeMove,
  turn,
  myUserId,
  players,
  winner,
  winningSequence = [],
}: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [timeLeftLocal, setTimeLeftLocal] = useState(20);

  const { grid = [], scores = {}, completedLines = [] } = board || {};
  const isMyTurn = turn === myUserId && !winner;

  // Sync turn timer
  useEffect(() => {
    // We locate the turn time left from the store state using game store
    const timerInterval = setInterval(() => {
      // Find room in useGameStore to retrieve turnTimeLeft
      const currentRoom = useGameStore.getState().room;
      if (currentRoom && currentRoom.status === 'playing') {
        const time = currentRoom.turnTimeLeft;
        setTimeLeftLocal(time);
        
        // Sound tick in last 5 seconds
        if (time > 0 && time <= 5 && turn === myUserId) {
          synth.playTickWarning();
        }
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [turn, myUserId]);

  // Audio effect triggers
  useEffect(() => {
    if (winner) {
      synth.playVictory();
    } else {
      synth.playTurnChange();
    }
  }, [turn, winner]);

  useEffect(() => {
    if (completedLines.length > 0) {
      synth.playLineComplete();
    }
  }, [completedLines.length]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    synth.muted = nextMuted;
  };

  const handleFullscreenToggle = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleCellClick = (number: number) => {
    if (isMyTurn) {
      synth.playTileClick();
      makeMove(number);
    }
  };

  // Determine positions of players around the board
  // Solo vs Computer: Computer top, You bottom
  // 2 Players: P2 top, P1 bottom
  // 3 Players: P2 top-left, P3 top-right, P1 bottom
  // 4 Players: P2 top-left, P3 top-right, P1 bottom-left, P4 bottom-right
  const getPlayerPositionClass = (idx: number, total: number) => {
    if (total <= 2) {
      // Solo vs Computer or 2 Players
      if (idx === 0) return 'order-3'; // You (Bottom)
      return 'order-1'; // Computer/Player 2 (Top)
    } else if (total === 3) {
      // 3 Players
      if (idx === 0) return 'order-3 col-span-2 flex justify-center'; // P1 (Bottom)
      if (idx === 1) return 'order-1 justify-self-start'; // P2 (Top Left)
      return 'order-2 justify-self-end'; // P3 (Top Right)
    } else {
      // 4 Players
      if (idx === 0) return 'order-3 justify-self-start'; // P1 (Bottom Left)
      if (idx === 1) return 'order-1 justify-self-start'; // P2 (Top Left)
      if (idx === 2) return 'order-2 justify-self-end'; // P3 (Top Right)
      return 'order-4 justify-self-end'; // P4 (Bottom Right)
    }
  };

  // SVG parameters for circular countdown
  const radius = 24;
  const circumference = 2 * Math.PI * radius;

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col items-center justify-center p-4 w-full h-full select-none transition-all ${
        isFullscreen ? 'bg-slate-950/95 py-12' : ''
      }`}
    >
      {/* HUD Toolbar Controls */}
      <div className="flex items-center gap-3 mb-6 z-20">
        <button
          onClick={toggleMute}
          className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-gray-400 hover:text-white hover:border-emerald-500/30 transition-all cursor-pointer shadow-md"
          title={isMuted ? 'Unmute Game Sounds' : 'Mute Game Sounds'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          onClick={handleFullscreenToggle}
          className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-gray-400 hover:text-white hover:border-emerald-500/30 transition-all cursor-pointer shadow-md"
          title={isFullscreen ? 'Exit Full Screen' : 'Go Full Screen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Dynamic Player Placement & Center Grid */}
      <div className="grid grid-cols-2 gap-y-6 md:gap-x-12 max-w-lg w-full items-center justify-items-center relative">
        {/* Map players surrounding board */}
        {players.map((player, idx) => {
          const isActive = turn === player.id && !winner;
          const score = scores[player.id] || 0;
          const letter = player.username ? player.username.charAt(0).toUpperCase() : 'P';
          const isMe = player.id === myUserId;
          const posClass = getPlayerPositionClass(idx, players.length);
          
          // Circular progress offset
          const dashOffset = isActive 
            ? circumference - (Math.max(0, Math.min(20, timeLeftLocal)) / 20) * circumference 
            : circumference;

          return (
            <div 
              key={player.id} 
              className={`w-40 glass-panel border rounded-2xl p-3 flex flex-col items-center gap-2 relative transition-all duration-300 z-10 shrink-0 ${posClass} ${
                isActive 
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30 animate-pulse' 
                  : 'border-white/5 bg-slate-950/40'
              }`}
            >
              {/* Turn indicator glow ring */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                {/* SVG Countdown Ring */}
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    fill="transparent"
                    stroke={isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)'}
                    strokeWidth="3.5"
                  />
                  {isActive && (
                    <circle
                      cx="28"
                      cy="28"
                      r={radius}
                      fill="transparent"
                      stroke={timeLeftLocal <= 5 ? '#f43f5e' : '#10b981'}
                      strokeWidth="3.5"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                    />
                  )}
                </svg>

                {/* Avatar circle */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm relative border ${
                  isMe 
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600 border-violet-400/25 text-white' 
                    : player.id === 'computer_bot'
                      ? 'bg-gradient-to-br from-cyan-600 to-teal-600 border-cyan-400/25 text-white'
                      : 'bg-slate-800 border-white/5 text-gray-300'
                }`}>
                  {letter}
                  
                  {/* Active turn badge */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 border border-slate-950 flex items-center justify-center text-[9px] font-black text-slate-950">
                      {timeLeftLocal}
                    </div>
                  )}
                </div>
              </div>

              {/* Roster Information */}
              <div className="text-center min-w-0 w-full">
                <div className="text-xs font-black text-gray-200 truncate flex items-center justify-center gap-1">
                  {player.username}
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-[9px] font-black font-mono">
                  Line Score: {score} / 5
                </div>
              </div>
            </div>
          );
        })}

        {/* 5x5 Bingo Board (Middle Layout Spacer) */}
        <div className="col-span-2 order-2 w-full max-w-[340px] aspect-square p-2 bg-slate-950/60 rounded-3xl border border-white/5 shadow-2xl relative flex items-center justify-center my-2">
          
          <div className="grid grid-cols-5 gap-2 w-full h-full">
            {grid.map((cell: any, idx: number) => {
              const isWinningCell = completedLines.some((line: number[]) => line.includes(idx));
              const isCellEmpty = !cell.marked;

              return (
                <button
                  key={idx}
                  disabled={!isMyTurn || !isCellEmpty}
                  onClick={() => handleCellClick(cell.number)}
                  className={`relative flex flex-col items-center justify-center rounded-2xl aspect-square border text-xs font-black transition-all cursor-pointer ${
                    isCellEmpty
                      ? isMyTurn
                        ? 'bg-slate-900 border-white/5 text-gray-300 hover:bg-slate-800 hover:border-emerald-500/50 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/5'
                        : 'bg-slate-900/60 border-white/5 text-gray-500'
                      : 'bg-slate-950 border-white/5 text-gray-600 shadow-inner'
                  } ${
                    isWinningCell
                      ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/15 border-emerald-500 shadow-lg shadow-emerald-500/20 text-emerald-400 animate-pulse'
                      : ''
                  }`}
                >
                  {/* Cut / Marked cross indicator overlay */}
                  {!isCellEmpty && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-2 border-t-2 border-r-2 border-emerald-500/40 transform rotate-45 pointer-events-none rounded"
                    />
                  )}
                  
                  {!isCellEmpty && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-2 border-t-2 border-l-2 border-emerald-500/40 transform -rotate-45 pointer-events-none rounded"
                    />
                  )}

                  <span className={`z-10 ${!isCellEmpty ? 'line-through text-emerald-500/60 opacity-60' : ''}`}>
                    {cell.number}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
