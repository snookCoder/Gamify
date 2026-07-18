"use client";

import React, { useEffect, useState } from 'react';
import { useMusicStore } from '../store/useMusicStore';
import { LogOut, Music } from 'lucide-react';

export const MusicBanner: React.FC = () => {
  const { room, leaveRoom, currentSong, isPlaying, stop } = useMusicStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!room && !currentSong) return null;

  return (
    <div className="w-full bg-[#07080b]/98 border-b border-emerald-500/30 text-white py-2 px-4 flex items-center justify-between text-xs select-none sticky top-0 z-[100] backdrop-blur-md shadow-[0_2px_15px_rgba(16,185,129,0.15)] transition-all animate-none shrink-0 font-sans">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 shrink-0">
          <Music className={`w-3.5 h-3.5 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
        </div>
        <div className="min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-wider text-purple-400 font-black leading-none">
            {room ? '🔊 active music party lobby' : '🎵 playing music solo'}
          </div>
          <div className="text-gray-255 font-bold truncate mt-1 max-w-[280px] sm:max-w-md md:max-w-xl text-[11px] leading-tight">
            {room ? `${room.name} (${room.players.length}/${room.maxParticipants} players)` : `${currentSong.title} - ${currentSong.artist}`}
          </div>
        </div>
      </div>
      
      <button
        onClick={() => {
          if (room) {
            leaveRoom();
          } else {
            stop();
          }
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-455 hover:text-white border border-rose-500/25 active:scale-95 transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer shrink-0 ml-4 hover:shadow-[0_0_8px_rgba(239,68,68,0.4)]"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>{room ? 'Leave Party' : 'Stop Music'}</span>
      </button>
    </div>
  );
};
