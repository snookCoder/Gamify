import React, { useState } from 'react';
import { useMusicStore, Song } from '../../store/useMusicStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Trash2, ChevronUp, ChevronDown, Copy, Settings, Crown, LogOut, CheckCircle2, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { useGameStore } from '../../store/useGameStore';

export const MusicQueue: React.FC = () => {
  const {
    room,
    isRoomMode,
    localQueue,
    removeFromQueue,
    reorderQueue,
    approveRequest,
    transferHost,
    toggleControl,
    leaveRoom,
    addToast
  } = useMusicStore();

  const { user } = useAuthStore();
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'queue' | 'invite'>('queue');
  const [friends, setFriends] = useState<any[]>([]);
  const [invitedIds, setInvitedIds] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (isRoomMode) {
      api.chats.getConversations()
        .then((data) => setFriends(data || []))
        .catch((err) => console.error('Failed to load friends:', err));
    }
  }, [isRoomMode]);

  const handleSendInvite = (friendId: string, username: string) => {
    if (!room) return;
    const socket = useGameStore.getState().socket;
    if (socket) {
      socket.emit('send-private-msg', {
        toUserId: friendId,
        message: `🎶 Join my synchronized Music Lobbies Room!\nLobby: "${room.name}"\nCode: ${room.id}\nClick to join: ${window.location.origin}/games/music-room?join=${room.id}`,
        type: 'text'
      });
      setInvitedIds((prev) => ({ ...prev, [friendId]: true }));
      addToast(`Invite sent to ${username}!`, 'success');
      setTimeout(() => {
        setInvitedIds((prev) => ({ ...prev, [friendId]: false }));
      }, 3000);
    }
  };

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

  // Removed voting handlers

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

        {isRoomMode && (
          <div className="flex bg-slate-950/45 p-1 rounded-xl border border-white/5 mt-3 select-none">
            <button
              onClick={() => setSidebarTab('queue')}
              className={`flex-1 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${sidebarTab === 'queue' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-450 hover:text-gray-200'}`}
            >
              Lobby Queue
            </button>
            <button
              onClick={() => setSidebarTab('invite')}
              className={`flex-1 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${sidebarTab === 'invite' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-450 hover:text-gray-200'}`}
            >
              Invite Friends
            </button>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 z-10 space-y-4">
        {sidebarTab === 'queue' ? (
          <>
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
            {/* Pending Song Requests (Host Only) */}
            {isRoomMode && isHost && room.requests && room.requests.length > 0 && (
              <div className="mb-4 animate-none">
                <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest font-mono mb-2 select-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_6px_#a855f7]" />
                  Pending Song Requests ({room.requests.length})
                </div>
                <div className="space-y-2.5 bg-purple-950/10 border border-purple-500/10 p-2.5 rounded-2xl max-h-[220px] overflow-y-auto">
                  {room.requests.map((song) => (
                    <div key={`${song.id}_req`} className="flex items-center justify-between p-2 bg-slate-900/40 border border-white/5 rounded-xl">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
                          {song.artworkUrl100 ? (
                            <img src={song.artworkUrl100} alt={song.title} className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-250 truncate">{song.title}</div>
                          <div className="text-[9px] text-gray-500 truncate mt-0.5">Requested by: {song.addedBy || 'Player'}</div>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => approveRequest(song.id, 'approve')}
                          className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-450 hover:text-white rounded-lg border border-emerald-500/20 active:scale-95 text-[9px] font-black transition-all cursor-pointer uppercase tracking-wider"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => approveRequest(song.id, 'reject')}
                          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-455 hover:text-white rounded-lg border border-rose-500/20 active:scale-95 text-[9px] font-black transition-all cursor-pointer uppercase tracking-wider"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
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
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                              {song.artworkUrl100 ? (
                                <img src={song.artworkUrl100} alt={song.title} className="w-full h-full object-cover" />
                              ) : (
                                <Music className="w-4 h-4 text-emerald-450" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-gray-200 truncate">{song.title}</div>
                              <div className="text-[9px] text-gray-550 truncate flex items-center gap-1.5">
                                <span>{song.artist}</span>
                                {song.addedBy && (
                                  <span className="text-[8px] bg-slate-950/40 text-purple-400 border border-purple-500/10 px-1 rounded-sm uppercase tracking-wide font-mono font-bold">
                                    👤 {song.addedBy}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Side: Remove button */}
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
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
          </>
        ) : (
          /* Invite Friends Panel */
          <div className="space-y-2.5 h-full overflow-y-auto pr-1">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono mb-2 select-none">
              Invite Chat Friends
            </div>
            {friends.length === 0 ? (
              <div className="text-center py-10 text-[11px] text-gray-500 italic bg-slate-950/20 p-4 border border-white/5 rounded-2xl">
                No chat partners found to invite. Start a conversation in Chats first!
              </div>
            ) : (
              friends.map(f => {
                const partner = f.participant;
                if (!partner) return null;
                const isAlreadyInLobby = room?.players.some(p => p.username === partner.username);
                const isInvited = invitedIds[partner.id || partner._id];

                return (
                  <div
                    key={partner.id || partner._id}
                    className="flex items-center justify-between p-2.5 bg-slate-900/30 border border-white/5 rounded-2xl hover:border-purple-500/10 transition-all select-none"
                  >
                    <div className="flex items-center gap-2 max-w-[65%] min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-white/5 text-xs font-bold text-gray-300 shrink-0 uppercase">
                        {partner.username.substring(0, 2)}
                      </div>
                      <div className="truncate leading-none">
                        <div className="text-xs font-bold text-gray-200 truncate">{partner.username}</div>
                        <span className="text-[8px] text-gray-500 mt-1 block">
                          {partner.isOnline ? '🟢 Active Now' : '⚪ Offline'}
                        </span>
                      </div>
                    </div>
                    
                    {isAlreadyInLobby ? (
                      <span className="text-[9px] text-emerald-450 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15 shrink-0">
                        In Room
                      </span>
                    ) : (
                      <button
                        disabled={isInvited}
                        onClick={() => handleSendInvite(partner.id || partner._id, partner.username)}
                        className={`text-[9px] font-extrabold px-3 py-1 rounded-lg transition-all cursor-pointer border shrink-0
                          ${isInvited
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/25'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-450 border-emerald-500/25 active:scale-95'}`}
                      >
                        {isInvited ? 'Invited' : 'Invite'}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
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
