'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/useAuthStore';
import { useGameStore } from '../../../store/useGameStore';
import { Navbar } from '../../../components/Navbar';
import { Chat } from '../../../components/Chat';
import { GameContainer } from '../../../components/GameContainer';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Shield, CheckCircle2, XCircle, Copy, LogOut, Gamepad2, MessageSquare, X, Lock, Link, Swords, Disc } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { 
    room, 
    leaveRoom, 
    toggleReady, 
    startGame, 
    isConnected, 
    onlineUsers, 
    sendInvite,
    chatMessages 
  } = useGameStore();

  const [copied, setCopied] = useState(false);
  const [invitedUserIds, setInvitedUserIds] = useState<Record<string, boolean>>({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastReadCount, setLastReadCount] = useState(0);

  // Guess The Song host lobby state
  const [songCategory, setSongCategory] = useState('Pop');
  const [songDifficulty, setSongDifficulty] = useState('medium');
  const [songRounds, setSongRounds] = useState(10);
  const [songCustomSearch, setSongCustomSearch] = useState('');

  const [fetchedSongs, setFetchedSongs] = useState<any[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  useEffect(() => {
    const isHostLocal = room && user ? room.hostId === user.id : false;
    if (room && room.game === 'guess-the-song' && isHostLocal) {
      const fetchSongsLobby = async () => {
        setLoadingSongs(true);
        let searchTerm = 'English Pop';
        if (songCategory === 'Bollywood') searchTerm = 'Bollywood Hits';
        else if (songCategory === 'Hollywood') searchTerm = 'Hollywood Pop';
        else if (songCategory === 'Punjabi') searchTerm = 'Punjabi Pop';
        else if (songCategory === 'Anime') searchTerm = 'Anime theme';
        else if (songCategory === '90s') searchTerm = '90s Hits';
        else if (songCategory === 'Pop') searchTerm = 'English Pop';
        else if (songCategory === 'Rock') searchTerm = 'Rock classics';
        else if (songCategory === 'Hip Hop') searchTerm = 'Hip Hop';
        else if (songCategory === 'Custom') searchTerm = songCustomSearch || 'Hits';

        try {
          const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&media=music&entity=song&limit=100`);
          const data = await response.json();
          const results = data.results || [];
          const validSongs = results
            .filter((t: any) => t.previewUrl)
            .map((t: any) => ({
              id: String(t.trackId),
              title: t.trackName || 'Unknown Song',
              artist: t.artistName || 'Unknown Artist',
              album: t.collectionName || 'Single',
              previewUrl: t.previewUrl || '',
              artworkUrl: t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg') : ''
            }));
          setFetchedSongs(validSongs);
          setSelectedSongIds(validSongs.slice(0, Math.min(validSongs.length, songRounds)).map((s: any) => s.id));
        } catch (err) {
          console.error('Error fetching lobby songs:', err);
        } finally {
          setLoadingSongs(false);
        }
      };

      fetchSongsLobby();
    }
  }, [songCategory, songCustomSearch, room?.game, user, songRounds]);

  useEffect(() => {
    if (isChatOpen && chatMessages) {
      setLastReadCount(chatMessages.length);
    }
  }, [isChatOpen, chatMessages]);

  const unreadCount = chatMessages ? Math.max(0, chatMessages.length - lastReadCount) : 0;

  const handleInvite = (targetUserId: string) => {
    if (room) {
      sendInvite(targetUserId, room.id);
      setInvitedUserIds((prev) => ({ ...prev, [targetUserId]: true }));
      setTimeout(() => {
        setInvitedUserIds((prev) => ({ ...prev, [targetUserId]: false }));
      }, 4000);
    }
  };

  useEffect(() => {
    if (isConnected && !room) {
      router.push('/');
    }
  }, [room, router, isConnected]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, router]);

  if (!room || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#06070a] relative overflow-hidden select-none">
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/5 rounded-full filter blur-[80px] pointer-events-none" />

        <div className="flex flex-col items-center z-10">
          <div className="relative flex items-center justify-center w-24 h-24 mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-violet-500/40"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-2 rounded-full border-2 border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
            />
            <motion.div
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-2xl flex items-center justify-center border border-violet-400/20 shadow-lg shadow-violet-500/20"
            >
              <Gamepad2 className="w-7 h-7 text-white" />
            </motion.div>
          </div>

          <motion.h1
            initial={{ letterSpacing: "0.2em", opacity: 0.7 }}
            animate={{ letterSpacing: "0.3em", opacity: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            className="font-display font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-white to-cyan-400 tracking-[0.25em] uppercase pl-[0.25em]"
          >
            PlayVerse
          </motion.h1>

          <motion.span
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.15em] mt-3 font-mono"
          >
            Syncing Arena Details...
          </motion.span>
        </div>
      </div>
    );
  }

  const isHost = room.hostId === user.id;
  const myPlayerInfo = room.players.find((p) => p.id === user.id);
  const guestPlayer = room.players[1];

  const copyInviteLink = () => {
    const link = `${window.location.origin}/room/${room.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (room && room.game === 'guess-the-song') {
      const songsToPlay = fetchedSongs.filter((s) => selectedSongIds.includes(s.id));
      startGame({
        category: songCategory,
        difficulty: songDifficulty,
        songs: songsToPlay
      });
    } else {
      startGame();
    }
  };

  const handleToggleReady = () => {
    if (myPlayerInfo) {
      toggleReady(!myPlayerInfo.isReady);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    router.push('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#090a0f] cyber-grid">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* Sleek Header Bar */}
        <div className="relative glass-panel rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/5 shadow-xl overflow-hidden">
          {/* Subtle glow border */}
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-violet-600 via-transparent to-cyan-500 opacity-50" />
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">
                Arena Match Room
              </span>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-950/60 pl-3 pr-1.5 py-1 rounded-xl border border-white/5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">Code:</span>
              <span className="text-sm font-black text-violet-400 font-mono tracking-widest">
                {room.id}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyInviteLink}
                className="p-1 min-w-0 hover:bg-white/5 rounded-lg cursor-pointer"
                title="Copy Invite Link"
              >
                {copied ? (
                  <span className="text-[9px] text-emerald-400 font-bold font-mono">Copied!</span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-450 hover:text-white" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            variant="danger" 
            size="sm" 
            onClick={handleLeaveRoom} 
            className="gap-1.5 border border-red-500/20 shadow-md cursor-pointer text-xs shrink-0 px-4 py-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Leave Lobby
          </Button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            {room.status === 'waiting' ? (
              <div className="relative glass-panel rounded-3xl p-6 sm:p-8 flex flex-col items-center shadow-2xl border border-white/5 min-h-[440px] justify-between overflow-hidden">
                {/* Background Ambient Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-violet-600/5 rounded-full filter blur-[60px] pointer-events-none" />
                
                {/* Header */}
                <div className="text-center z-10">
                  <h2 className="text-xs font-black text-violet-400 uppercase tracking-[0.25em] font-mono">
                    MATCHMAKING LOBBY
                  </h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">
                    Waiting for gladiators to accept challenge
                  </p>
                </div>

                {/* Slots Grid */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch flex-1 my-8 z-10">
                  
                  {/* Slot 1: Host */}
                  <div className="relative flex flex-col items-center justify-between text-center p-6 bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-violet-500/20 rounded-2xl shadow-lg group hover:border-violet-500/30 transition-all duration-300">
                    <div className="absolute top-3 left-3 bg-violet-500/10 border border-violet-500/20 text-violet-400 p-1.5 rounded-lg text-xs" title="Lobby Host">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    
                    <div className="flex flex-col items-center my-auto">
                      <div className="relative p-1 bg-violet-500/10 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.15)] group-hover:shadow-[0_0_20px_rgba(139,92,246,0.25)] transition-all">
                        <Avatar name={room.players[0]?.avatar} size="lg" />
                        <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-[0_0_8px_#10b981]" />
                      </div>
                      
                      <h3 className="font-display font-black text-lg text-gray-200 mt-4 tracking-wide">
                        {room.players[0]?.username}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-gray-400 font-mono">
                        <span>Rating:</span>
                        <span className="font-bold text-violet-400">{room.players[0]?.rating} PTS</span>
                      </div>
                    </div>
                    
                    <div className="w-full mt-6">
                      <span className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-black bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/20 uppercase tracking-wider font-mono shadow-inner">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" /> HOST READY
                      </span>
                    </div>
                  </div>

                  {/* Slot 2: Guest / Challenger */}
                  <div className="relative flex flex-col items-center justify-between text-center p-6 bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-white/5 rounded-2xl shadow-lg transition-all duration-300">
                    
                    {guestPlayer ? (
                      /* Active Guest Player */
                      <>
                        <div className="flex flex-col items-center my-auto">
                          <div className="relative p-1 bg-cyan-500/10 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                            <Avatar name={guestPlayer.avatar} size="lg" />
                            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-[0_0_8px_#10b981]" />
                          </div>
                          
                          <h3 className="font-display font-black text-lg text-gray-200 mt-4 tracking-wide">
                            {guestPlayer.username}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-gray-400 font-mono">
                            <span>Rating:</span>
                            <span className="font-bold text-cyan-400">{guestPlayer.rating} PTS</span>
                          </div>
                        </div>
                        
                        <div className="w-full mt-6">
                          <span
                            className={`flex items-center justify-center gap-1.5 text-xs font-black py-2 rounded-xl border uppercase tracking-wider font-mono shadow-inner ${
                              guestPlayer.isReady
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                            }`}
                          >
                            {guestPlayer.isReady ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" /> COMBAT READY
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" /> PREPARING...
                              </>
                            )}
                          </span>
                        </div>
                      </>
                    ) : (
                      /* Empty Slot - Waiting & Invite */
                      (() => {
                        const availableInvitees = onlineUsers.filter((u) => u._id !== user.id);
                        return (
                          <div className="w-full flex flex-col items-center justify-between h-full">
                            
                            {/* Visual Search radar when list is empty */}
                            {availableInvitees.length === 0 ? (
                              <div className="flex flex-col items-center justify-center my-auto py-4">
                                <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                                  {/* Dashed spin circle */}
                                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/30 animate-spin" />
                                  <div className="absolute inset-2.5 rounded-full border border-cyan-500/10 animate-ping opacity-60" />
                                  <div className="w-12 h-12 rounded-full bg-cyan-600/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                    <span className="text-lg font-black animate-pulse">?</span>
                                  </div>
                                </div>
                                
                                <h4 className="text-sm font-black text-gray-300 tracking-wide">WAITING FOR CHALLENGER</h4>
                                <p className="text-[10px] text-gray-500 mt-1 max-w-[180px]">
                                  Lobby is active. Share the link below to invite a friend!
                                </p>
                                
                                <button 
                                  onClick={copyInviteLink}
                                  className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-cyan-400 border border-cyan-500/20 active:scale-95 transition-all cursor-pointer"
                                >
                                  <Link className="w-3 h-3" /> Copy Invite Link
                                </button>
                              </div>
                            ) : (
                              /* List of Online Challengers to Invite */
                              <div className="w-full flex flex-col items-stretch text-left">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3.5 text-center font-display">
                                  INVITE ONLINE CHALLENGERS
                                </h3>
                                
                                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                  {availableInvitees.map((onlineUser) => {
                                    const isInvited = !!invitedUserIds[onlineUser._id];
                                    return (
                                      <div
                                        key={onlineUser._id}
                                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-white/5 hover:border-violet-500/20 transition-all"
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <Avatar name={onlineUser.avatar} size="sm" />
                                          <div className="leading-tight truncate">
                                            <div className="text-xs font-bold text-gray-200 truncate max-w-[85px]">
                                              {onlineUser.username}
                                            </div>
                                            <div className="text-[9px] text-cyan-450 font-mono mt-0.5">
                                              {onlineUser.rating} PTS
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          variant={isInvited ? 'secondary' : 'outline'}
                                          size="sm"
                                          disabled={isInvited}
                                          onClick={() => handleInvite(onlineUser._id)}
                                          className="text-[9px] px-2.5 py-1 font-bold border-cyan-500/20 text-cyan-400 hover:bg-cyan-600 hover:text-white shrink-0 cursor-pointer"
                                        >
                                          {isInvited ? 'Sent' : 'Invite'}
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>

                {/* Guess the Song Host Settings */}
                {isHost && room && room.game === 'guess-the-song' && (
                  <div className="w-full max-w-sm p-4 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-inner mb-4 flex flex-col gap-3">
                    <div className="text-[10px] text-violet-400 font-extrabold uppercase tracking-widest mb-1">
                      ⚙️ Room Settings (Host Only)
                    </div>
                    
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[10px] text-gray-400 font-bold uppercase">Category</label>
                      <select 
                        value={songCategory} 
                        onChange={(e) => setSongCategory(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-violet-500 cursor-pointer animate-none"
                      >
                        <option value="Pop">English Pop 🎵</option>
                        <option value="Bollywood">Bollywood Hits 🇮🇳</option>
                        <option value="Punjabi">Punjabi Beats 🥁</option>
                        <option value="Hollywood">Hollywood Soundtracks 🎬</option>
                        <option value="Anime">Anime Theme Songs 🌟</option>
                        <option value="90s">90s Retro Hits 💿</option>
                        <option value="Rock">Classic Rock 🎸</option>
                        <option value="Hip Hop">Hip Hop / Rap 🎤</option>
                        <option value="Custom">Custom search... 🔍</option>
                      </select>
                    </div>

                    {songCategory === 'Custom' && (
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[10px] text-gray-400 font-bold uppercase">Custom Term (e.g. Michael Jackson)</label>
                        <input
                          type="text"
                          value={songCustomSearch}
                          onChange={(e) => setSongCustomSearch(e.target.value)}
                          placeholder="Type an artist, genre or album..."
                          className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[10px] text-gray-400 font-bold uppercase">Difficulty</label>
                        <select 
                          value={songDifficulty} 
                          onChange={(e) => setSongDifficulty(e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-violet-500 cursor-pointer animate-none"
                        >
                          <option value="easy">Easy (20s preview)</option>
                          <option value="medium">Medium (15s preview)</option>
                          <option value="hard">Hard (10s preview)</option>
                          <option value="extreme">Extreme (5s preview)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[10px] text-gray-400 font-bold uppercase">Rounds</label>
                        <select 
                          value={songRounds} 
                          onChange={(e) => setSongRounds(Number(e.target.value))}
                          className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-violet-500 cursor-pointer animate-none"
                        >
                          <option value="5">5 Rounds</option>
                          <option value="10">10 Rounds</option>
                          <option value="15">15 Rounds</option>
                          <option value="20">20 Rounds</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 text-left border-t border-white/5 pt-2 mt-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase flex justify-between">
                        <span>Select Playlist ({selectedSongIds.length} checked)</span>
                        {fetchedSongs.length > 0 && (
                          <button
                            onClick={() => {
                              if (selectedSongIds.length === fetchedSongs.length) {
                                setSelectedSongIds([]);
                              } else {
                                setSelectedSongIds(fetchedSongs.map(s => s.id));
                              }
                            }}
                            className="text-[9px] text-violet-400 hover:text-violet-300 font-semibold cursor-pointer select-none border-none bg-transparent p-0"
                          >
                            Toggle All
                          </button>
                        )}
                      </label>
                      
                      {loadingSongs ? (
                        <div className="text-[10px] text-gray-500 py-3 text-center animate-pulse">Fetching track list...</div>
                      ) : fetchedSongs.length === 0 ? (
                        <div className="text-[10px] text-gray-500 py-3 text-center">No songs found. Try changing category.</div>
                      ) : (
                        <div className="max-h-[140px] overflow-y-auto border border-white/5 bg-slate-950/60 rounded-lg p-2 flex flex-col gap-1 scrollbar-thin">
                          {fetchedSongs.map((song) => {
                            const isChecked = selectedSongIds.includes(song.id);
                            return (
                              <label 
                                key={song.id} 
                                className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-white/5 cursor-pointer select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedSongIds((prev) => [...prev, song.id]);
                                    } else {
                                      setSelectedSongIds((prev) => prev.filter((id) => id !== song.id));
                                    }
                                  }}
                                  className="accent-violet-500 w-3 h-3 cursor-pointer"
                                />
                                <div className="flex items-center gap-2 truncate">
                                  {song.artworkUrl ? (
                                    <img src={song.artworkUrl} className="w-5 h-5 rounded object-cover shrink-0" />
                                  ) : (
                                    <div className="w-5 h-5 bg-slate-900 flex items-center justify-center shrink-0 rounded"><Disc className="w-3 h-3 text-gray-600" /></div>
                                  )}
                                  <div className="flex flex-col leading-tight truncate text-left">
                                    <span className="text-[10px] font-black text-white truncate max-w-[170px]">{song.title}</span>
                                    <span className="text-[8px] text-gray-400 truncate max-w-[170px]">{song.artist}</span>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Launch Button Section */}
                <div className="w-full max-w-sm mt-4 z-10">
                  {isHost ? (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleStartGame}
                      disabled={room.players.length < 2 || !room.players.every((p) => p.isReady)}
                      className={`py-3.5 text-xs font-black tracking-[0.2em] uppercase rounded-xl border ${
                        room.players.length < 2 || !room.players.every((p) => p.isReady)
                          ? 'border-white/5 opacity-40'
                          : 'border-violet-400/20 shadow-lg shadow-violet-500/20 animate-pulse-glow hover:brightness-110'
                      } cursor-pointer`}
                    >
                      {room.players.length < 2 || !room.players.every((p) => p.isReady) ? (
                        <span className="flex items-center justify-center gap-2">
                          <Lock className="w-4 h-4" /> START MATCH
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Swords className="w-4 h-4 text-white animate-bounce" /> LAUNCH DUEL
                        </span>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant={myPlayerInfo?.isReady ? 'secondary' : 'primary'}
                      fullWidth
                      onClick={handleToggleReady}
                      className={`py-3.5 text-xs font-black tracking-[0.2em] uppercase rounded-xl border cursor-pointer ${
                        myPlayerInfo?.isReady 
                          ? 'border-slate-700/50 hover:bg-slate-750' 
                          : 'border-violet-500/30 animate-pulse-glow'
                      }`}
                    >
                      {myPlayerInfo?.isReady ? 'CANCEL READY' : 'SET COMBAT READY'}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl overflow-hidden shadow-lg border border-white/5 min-h-[400px]">
                <GameContainer />
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <Chat />
          </div>
        </div>
      </main>

      {/* Mobile Floating Chat Button */}
      {!isChatOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 lg:hidden bg-gradient-to-r from-violet-600 to-indigo-500 text-white p-4 rounded-full shadow-lg shadow-violet-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer border border-violet-500/30"
        >
          <MessageSquare className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-900 shadow-md">
              {unreadCount}
            </span>
          )}
        </motion.button>
      )}

      {/* Mobile Chat Drawer Overlay */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsChatOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          {/* Drawer Body */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-xs h-full bg-[#090a0f] border-l border-white/5 flex flex-col p-4 shadow-2xl z-10"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                <h3 className="font-display font-extrabold text-sm text-gray-200 uppercase tracking-wider">
                  Room Chat
                </h3>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Scrollable chat body */}
            <div className="flex-1 min-h-0">
              <Chat />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
