'use client';

import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Users, PlusCircle, ArrowRight, RefreshCw } from 'lucide-react';

export const ActiveRooms: React.FC = () => {
  const { publicRooms, joinRoom, createRoom, refreshLobby } = useGameStore();
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCodeInput.trim().length === 5) {
      joinRoom(roomCodeInput.trim().toUpperCase());
    }
  };

  const handleCreateRoom = (game: string) => {
    createRoom(game, false);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshLobby();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full shadow-lg card-transition hover:border-violet-500/20 hover-glow-purple">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="font-display font-bold text-lg text-gray-100 tracking-wide">
            LOBBY / ROOMS
          </h2>
          <button
            onClick={handleRefresh}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Refresh Lobbies"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={() => handleCreateRoom('tic-tac-toe')} className="gap-1.5 cursor-pointer">
          <PlusCircle className="w-4 h-4" /> Create Room
        </Button>
      </div>

      <form onSubmit={handleJoinByCode} className="flex gap-2.5 mb-6">
        <Input
          placeholder="ENTER 5-LETTER CODE"
          value={roomCodeInput}
          onChange={(e) => setRoomCodeInput(e.target.value.slice(0, 5))}
          className="uppercase text-center tracking-widest font-mono text-base font-bold placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={roomCodeInput.trim().length !== 5}
          className="px-6 shrink-0 cursor-pointer"
        >
          Join <ArrowRight className="ml-1.5 w-4 h-4" />
        </Button>
      </form>

      <div className="flex-1 flex flex-col">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Public Rooms
        </h3>

        {publicRooms.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 border border-dashed border-white/5 rounded-xl bg-slate-900/10">
            <Users className="w-8 h-8 text-gray-600 mb-2.5" />
            <p className="text-sm text-gray-400 font-medium">No open lobbies found</p>
            <p className="text-xs text-gray-500 text-center mt-1">
              Create a public room or join one with a room code!
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[300px] pr-1">
            {publicRooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/70 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white tracking-wide">
                      {room.game === 'tic-tac-toe' ? 'Tic-Tac-Toe' : room.game}
                    </span>
                    <span className="bg-slate-800 text-[10px] font-bold text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/10 uppercase tracking-widest font-mono">
                      {room.id}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Host: <span className="font-semibold text-gray-300">{room.players[0]?.username}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {room.players.length}/2
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => joinRoom(room.id)}
                    className="hover:bg-violet-600 hover:text-white cursor-pointer"
                  >
                    Join
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
