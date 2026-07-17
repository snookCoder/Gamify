import React, { useState } from 'react';
import { useMusicStore } from '../../store/useMusicStore';
import { X, Users, Lock, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreateRoomModalProps {
  onClose: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose }) => {
  const { createRoom, isCreatingRoom } = useMusicStore();
  const [roomName, setRoomName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number>(5);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRoom(roomName.trim(), maxParticipants, isPrivate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-[#090a0f] border border-white/10 w-full max-w-md rounded-3xl p-6 relative overflow-hidden shadow-2xl z-10 font-sans"
      >
        {/* Glow Effects */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-600/10 rounded-full filter blur-[40px] pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full filter blur-[40px] pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/5 relative z-10">
          <div>
            <h3 className="font-display font-extrabold text-lg text-white">Create Music Room</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Configure your live group music session</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 relative z-10">
          {/* Room Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">Room Name</label>
            <input
              type="text"
              placeholder="e.g. KK & Bollywood Hits Party"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
              required
            />
          </div>

          {/* Participant Limits */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Max Participants
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMaxParticipants(num)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border
                    ${maxParticipants === num 
                      ? 'bg-gradient-to-r from-emerald-500/20 to-purple-500/20 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/5' 
                      : 'bg-slate-950/40 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  {num} Players
                </button>
              ))}
            </div>
          </div>

          {/* Privacy settings */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">Room Privacy</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border
                  ${!isPrivate 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-slate-950/40 border-white/5 text-gray-400 hover:bg-white/5'}`}
              >
                <Unlock className="w-3.5 h-3.5" /> Public
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border
                  ${isPrivate 
                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                    : 'bg-slate-950/40 border-white/5 text-gray-400 hover:bg-white/5'}`}
              >
                <Lock className="w-3.5 h-3.5" /> Private
              </button>
            </div>
            <p className="text-[9px] text-gray-500 mt-1 pl-1">
              {isPrivate 
                ? 'Only friends with the code or invite links can join this room.' 
                : 'Anyone in the platform can see and join this lobby.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-950/60 border border-white/5 text-gray-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingRoom}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-purple-600 hover:from-emerald-400 hover:to-purple-500 text-white text-xs font-black transition-all cursor-pointer shadow-lg hover-glow-purple"
            >
              {isCreatingRoom ? 'Creating Room...' : 'Create Party'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
