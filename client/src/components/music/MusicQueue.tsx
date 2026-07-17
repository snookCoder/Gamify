import React, { useState } from 'react';
import { useMusicStore, Song } from '../../store/useMusicStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ThumbsUp, ThumbsDown, Trash2, ChevronUp, ChevronDown, Copy, Settings, Crown, LogOut, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MusicQueue: React.FC = () => {
  const {
    room,
    isRoomMode,
    localQueue,
    removeFromQueue,
    reorderQueue,
    voteSong,
    transferHost,
    toggleControl,
    leaveRoom,
    addToast
  } = useMusicStore();

  const { user } = useAuthStore();
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUserId = user?.id || '';
  const isHost = isRoomMode && room ? room.hostId === currentUserId : false;

  const copyInviteLink = () => {
    if (!room) return;
    const link = `${window.location.origin}/games/music-room?join=${room.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    addToast('Invite link copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.id);
    addToast('Room code copied!', 'success');
  };

  const getVoteState = (song: Song) => {
    if (!song.votes || !currentUserId) return null;
    return song.votes[currentUserId] || null;
  };

  const handleVote = (songId: string, currentVote: 'up' | 'down' | null, type: 'up' | 'down') => {
    const targetVote = currentVote === type ? null : type;
    voteSong(songId, targetVote);
  };

  const handleMoveUp = (index: number) => {
    const queue = isRoomMode ? [...(room?.queue || [])] : [...localQueue];
    if (index === 0) return;
    const temp = queue[index];
    queue[index] = queue[index - 1];
    queue[index - 1] = temp;
    
    reorderQueue(queue);
  };

  const handleMoveDown = (index: number) => {
    const queue = isRoomMode ? [...(room?.queue || [])] : [...localQueue];
    if (index === queue.length - 1) return;
    const temp = queue[index];
    queue[index] = queue[index + 1];
    queue[index + 1] = temp;
    
    reorderQueue(queue);
  };

  const handleRemove = (songId: string) => {
    removeFromQueue(songId);
  };

  const currentQueue = isRoomMode ? (room?.queue || []) : localQueue;

  return (
    <div className="w-full lg:w-80 h-full glass-panel border border-white/5 rounded-3xl flex flex-col overflow-hidden relative shadow-2xl">
      {/* Background Gradient */}
      <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

      {/* Header Info */}
      <div className="p-4 border-b border-white/5 bg-slate-950/20 select-none z-10 shrink-0">
        <h2 className="text-xs font-black text-emerald-400 uppercase tracking-widest font-mono">
          {isRoomMode ? 'Shared Playlist Queue' : 'Solo Listening Queue'}
        </h2>
        
        {isRoomMode && room && (
          <div className="mt-2.5 flex flex-col gap-2 bg-slate-950/60 p-3 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center text-xs font-bold text-gray-200">
              <span className="truncate pr-2">🏰 {room.name}</span>
              {isHost && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                  title="Room Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono mt-0.5">
              <div className="flex items-center gap-1">
                <span>Code:</span>
                <span className="font-extrabold text-purple-400 tracking-wider cursor-pointer" onClick={copyCode}>{room.id}</span>
              </div>
              <button
                onClick={copyInviteLink}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition-all cursor-pointer font-sans"
              >
                {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Invite Link'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 z-10 space-y-4">
        {/* Settings Sub-Panel (Host Only) */}
        {isRoomMode && showSettings && isHost && room && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-purple-950/15 border border-purple-500/10 rounded-2xl p-3 space-y-2 text-xs"
          >
            <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest font-mono">Room Settings</div>
            
            <div className="flex items-center justify-between py-1">
              <span className="text-gray-300 text-[10px] font-bold">Everyone controls playback:</span>
              <input
                type="checkbox"
                checked={room.allowEveryoneControl}
                onChange={(e) => toggleControl(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="border-t border-white/5 pt-1.5 mt-1.5">
              <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-1">Transfer Ownership</div>
              <div className="space-y-1">
                {room.players.filter(p => p.id !== currentUserId).map(p => (
                  <button
                    key={p.id}
                    onClick={() => transferHost(p.id)}
                    className="w-full flex items-center justify-between p-1.5 bg-slate-950/40 rounded-xl hover:bg-slate-900 border border-white/5 hover:border-purple-500/30 text-[10px] font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
                  >
                    <span className="truncate pr-1">👑 {p.username}</span>
                    <span>Assign Host</span>
                  </button>
                ))}
                {room.players.length <= 1 && (
                  <div className="text-[10px] text-gray-500 italic">No other players in room.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Room Roster List (Room Mode only) */}
        {isRoomMode && room && (
          <div className="bg-slate-950/20 border border-white/5 rounded-2xl p-3">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono mb-2">Room Roster ({room.players.length}/{room.maxParticipants})</div>
            <div className="space-y-2">
              {room.players.map(p => {
                const isPlayerHost = p.id === room.hostId;
                return (
                  <div key={p.id} className="flex items-center justify-between py-1 border-b border-white/5 last:border-b-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-5.5 h-5.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-[10px] flex items-center justify-center font-extrabold font-mono uppercase shrink-0">
                        {p.username.charAt(0)}
                      </div>
                      <div className="min-w-0 leading-none">
                        <div className="text-xs font-bold text-gray-200 truncate flex items-center gap-1">
                          {p.username}
                          {isPlayerHost && <Crown className="w-3 h-3 text-amber-400 fill-amber-500 shrink-0" />}
                        </div>
                        <span className="text-[8px] text-emerald-450 font-mono mt-0.5 tracking-wider uppercase">online</span>
                      </div>
                    </div>
                    {p.currentlyListening && (
                      <span className="text-[8px] max-w-[100px] text-gray-550 font-mono truncate italic text-right pl-1">
                        🔊 {p.currentlyListening}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Queue Song List */}
        <div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono mb-2 select-none">
            Queue List ({currentQueue.length})
          </div>

          <div className="space-y-2.5">
            {currentQueue.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500 italic">
                The queue is empty. Use the Search tab or playlists to add songs!
              </div>
            ) : (
              <AnimatePresence>
                {currentQueue.map((song, idx) => {
                  const voteState = getVoteState(song);
                  const isControlsAllowed = !isRoomMode || isHost || room?.allowEveryoneControl;

                  return (
                    <motion.div
                      key={`${song.id}_queue_${idx}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="group flex items-center justify-between p-2.5 bg-slate-900/30 border border-white/5 rounded-2xl hover:bg-slate-900/60 hover:border-emerald-500/10 transition-all card-transition"
                    >
                      {/* Left: Move buttons (Host / allowed control) */}
                      {isControlsAllowed && (
                        <div className="flex flex-col gap-0.5 shrink-0 mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className={`p-0.5 hover:bg-white/5 rounded text-gray-400 disabled:opacity-30 cursor-pointer`}
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === currentQueue.length - 1}
                            className={`p-0.5 hover:bg-white/5 rounded text-gray-400 disabled:opacity-30 cursor-pointer`}
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-gray-200 truncate">{song.title}</div>
                        <div className="text-[9px] text-gray-500 truncate flex items-center gap-1.5">
                          <span>{song.artist}</span>
                          {song.addedBy && (
                            <span className="text-[8px] bg-slate-950/40 text-purple-400 border border-purple-500/10 px-1 rounded-sm uppercase tracking-wide">
                              👤 {song.addedBy}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Voting (Room Mode) / Remove (Solo) */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isRoomMode ? (
                          <>
                            {/* Vote Count */}
                            <span className={`text-[10px] font-bold font-mono pr-1
                              ${(song.voteCount || 0) > 0 ? 'text-emerald-400' : (song.voteCount || 0) < 0 ? 'text-rose-500' : 'text-gray-500'}`}
                            >
                              {(song.voteCount || 0) > 0 ? `+${song.voteCount}` : song.voteCount || 0}
                            </span>

                            {/* Upvote */}
                            <button
                              onClick={() => handleVote(song.id, voteState, 'up')}
                              className={`p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer
                                ${voteState === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500'}`}
                            >
                              <ThumbsUp className="w-3 h-3 fill-current" />
                            </button>

                            {/* Downvote */}
                            <button
                              onClick={() => handleVote(song.id, voteState, 'down')}
                              className={`p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer
                                ${voteState === 'down' ? 'text-rose-500 bg-rose-500/10' : 'text-gray-500'}`}
                            >
                              <ThumbsDown className="w-3 h-3 fill-current" />
                            </button>
                          </>
                        ) : null}

                        {/* Remove button */}
                        {isControlsAllowed && (
                          <button
                            onClick={() => handleRemove(song.id)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Leave Room Button */}
      {isRoomMode && (
        <div className="p-4 border-t border-white/5 bg-slate-950/20 shrink-0 flex items-center">
          <button
            onClick={leaveRoom}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-455 border border-rose-500/20 text-xs font-black cursor-pointer shadow-md tracking-wider transition-all"
          >
            <LogOut className="w-4 h-4" /> Leave Music Room
          </button>
        </div>
      )}
    </div>
  );
};
