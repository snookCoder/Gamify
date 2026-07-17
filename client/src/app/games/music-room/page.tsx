'use client';

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/useAuthStore';
import { useGameStore } from '../../../store/useGameStore';
import { useMusicStore, Song } from '../../../store/useMusicStore';
import { Navbar } from '../../../components/Navbar';
import { BottomNav } from '../../../components/BottomNav';
import { MusicSidebar } from '../../../components/music/MusicSidebar';
import { MusicPlayer } from '../../../components/music/MusicPlayer';
import { MusicQueue } from '../../../components/music/MusicQueue';
import { MusicChat } from '../../../components/music/MusicChat';
import { CreateRoomModal } from '../../../components/music/CreateRoomModal';
import { Loader } from '../../../components/ui/Loader';
import { Button } from '../../../components/ui/Button';
import { MessageSquare, ListMusic, Play, Radio, Users, PlusCircle, LogIn, Search, Heart, Pause, SkipForward, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function MusicRoomPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinCode = searchParams.get('join');

  const { isAuthenticated, user } = useAuthStore();
  const { connectSocket, socket, isConnected } = useGameStore();
  const {
    room,
    isRoomMode,
    toasts,
    currentSong,
    isPlaying,
    isPlayerExpanded,
    searchResults,
    isSearching,
    favorites,
    trendingSongs,
    playlists,
    fetchPlaylists,
    playPlaylist,
    addToast,
    setupSocketListeners,
    cleanupSocketListeners,
    joinRoom,
    removeToast,
    searchSongs,
    playSong,
    addToQueue,
    toggleFavorite,
    togglePlay,
    nextSong,
    setIsPlayerExpanded,
    leaveRoom
  } = useMusicStore();

  const [mounted, setMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  
  // Top Search Value
  const [searchVal, setSearchVal] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Responsive Tab for Tablet/Mobile
  const [mobileTab, setMobileTab] = useState<'library' | 'queue' | 'chat'>('library');

  useEffect(() => {
    setMounted(true);
    return () => {
      const { isRoomMode, leaveRoom, stop } = useMusicStore.getState();
      if (isRoomMode) {
        console.log('User navigated away from music-room, leaving room...');
        leaveRoom();
      } else {
        console.log('User navigated away from music-room, stopping solo playback...');
        stop();
      }
    };
  }, []);

  // Load playlists on mount
  useEffect(() => {
    if (mounted && isAuthenticated) {
      fetchPlaylists();
    }
  }, [mounted, isAuthenticated, fetchPlaylists]);

  // Debounced top search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchVal.trim()) {
        searchSongs(searchVal);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchVal, searchSongs]);

  // Click outside to close search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Connect socket if not connected
  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated) {
        router.push('/auth');
      } else {
        const token = useAuthStore.getState().token;
        if (token && !socket) {
          connectSocket(token);
        }
      }
    }
  }, [mounted, isAuthenticated, socket, connectSocket, router]);

  // Bind Music Sockets
  useEffect(() => {
    if (isConnected && socket) {
      setupSocketListeners();
      
      // Auto-join if URL contains room join query
      if (joinCode) {
        joinRoom(joinCode.toUpperCase());
        // Clean URL query
        const url = window.location.pathname;
        window.history.replaceState({}, '', url);
      }
      
      // Load trending hits for fallback autoplay list
      useMusicStore.getState().fetchTrendingSongs();

      return () => {
        cleanupSocketListeners();
      };
    }
  }, [isConnected, socket, setupSocketListeners, cleanupSocketListeners, joinCode, joinRoom]);

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#06070a] relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full filter blur-[120px] pointer-events-none" />
        <Loader size="lg" text="Entering Music Hub..." />
      </div>
    );
  }

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim() || joinCodeInput.trim().length !== 5) return;
    joinRoom(joinCodeInput.trim().toUpperCase());
    setJoinCodeInput('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#090a0f] cyber-grid relative font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-4 md:px-6 md:py-6 flex flex-col gap-4 pb-36 lg:pb-36 overflow-hidden">
        
        {/* Upper Header Control Bar (If not in room) */}
        {!isRoomMode && (
          <div className="glass-panel rounded-3xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5 shadow-xl relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full filter blur-[50px] -z-10" />
            <div className="flex items-center gap-3.5 text-left w-full md:w-auto">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-purple-500/20 flex items-center justify-center text-emerald-440 font-bold border border-white/5 shadow-md shrink-0">
                📻
              </div>
              <div>
                <h1 className="font-display font-extrabold text-lg md:text-xl text-white tracking-wide flex items-center gap-2">
                  Music Party Arena
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold tracking-widest font-mono">
                    SOLO MODE
                  </span>
                </h1>
                <p className="text-gray-400 text-xs mt-0.5">
                  Listen alone, search songs, or create rooms to play in perfect real-time sync with friends.
                </p>
              </div>
            </div>

            {/* Actions: Join or Create Room */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto select-none">
              {/* Join Input */}
              <form onSubmit={handleJoinSubmit} className="flex gap-1.5 w-full sm:w-auto bg-slate-950/40 p-1.5 rounded-2xl border border-white/5">
                <input
                  type="text"
                  maxLength={5}
                  placeholder="ENTER CODE..."
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="bg-transparent text-xs text-white uppercase font-mono tracking-widest font-extrabold px-3 py-1.5 w-28 focus:outline-none placeholder-gray-600"
                />
                <Button type="submit" variant="ghost" size="sm" className="gap-1 px-4 py-1.5 text-xs text-emerald-450 hover:bg-emerald-500/10 cursor-pointer">
                  <LogIn className="w-3.5 h-3.5" /> Join Party
                </Button>
              </form>

              {/* Create Button */}
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="gap-1.5 w-full sm:w-auto py-2.5 px-6 font-bold cursor-pointer text-xs md:text-sm whitespace-nowrap bg-gradient-to-r from-emerald-500 to-purple-600 hover:from-emerald-400 hover:to-purple-500 shadow-md shadow-emerald-500/5 hover-glow-purple"
              >
                <PlusCircle className="w-4 h-4" /> Create Music Room
              </Button>
            </div>
          </div>
        )}

        {/* Room Header Controls (If inside a room) */}
        {isRoomMode && room && (
          <div className="glass-panel rounded-2xl md:rounded-3xl p-3 md:p-4 px-4 flex flex-row items-center justify-between gap-3 border border-emerald-500/20 shadow-xl relative overflow-hidden shrink-0 animate-none">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full filter blur-[60px] -z-10" />
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <div className="min-w-0 leading-none">
                <h1 className="font-display font-extrabold text-sm md:text-base text-gray-200 tracking-wide truncate">
                  📻 Synced Room: <span className="text-white font-black">{room.name}</span>
                </h1>
                <p className="text-[9px] text-gray-550 mt-1 uppercase font-mono tracking-wider">
                  Host: {room.players.find(p => p.id === room.hostId)?.username || 'Unknown'} • Limit: {room.maxParticipants} Players
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 font-mono text-[10px]">
                <span className="text-gray-550 hidden xs:inline font-bold uppercase">Code:</span>
                <span className="bg-slate-950 border border-white/5 text-purple-400 font-black px-2.5 py-1 rounded-lg tracking-widest text-xs select-all">
                  {room.id}
                </span>
              </div>
              <button
                onClick={leaveRoom}
                className="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/30 text-rose-450 hover:text-rose-350 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide transition-all cursor-pointer shrink-0 uppercase shadow-md active:scale-95"
              >
                Leave
              </button>
            </div>
          </div>
        )}

        {/* --- Spotify-Style Top Search Bar --- */}
        <div ref={searchContainerRef} className="relative w-full max-w-2xl mx-auto z-30 select-none">
          <div className="relative">
            <input
              type="text"
              placeholder="Search full songs, artists, albums, Bollywood, KK..."
              value={searchVal}
              onFocus={() => setShowSearchResults(true)}
              onChange={(e) => {
                setSearchVal(e.target.value);
                setShowSearchResults(true);
              }}
              className="w-full bg-slate-900/60 border border-white/10 rounded-full py-3.5 pl-12 pr-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 shadow-lg transition-all font-sans"
            />
            <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-gray-500" />
            {searchVal && (
              <button
                onClick={() => setSearchVal('')}
                className="absolute right-4 top-3.5 text-gray-500 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Dropdown Panel */}
          <AnimatePresence>
            {showSearchResults && (searchVal.trim() !== '' || trendingSongs.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.99 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#0d0e14]/98 border border-white/10 rounded-3xl p-4.5 shadow-2xl z-40 max-h-96 overflow-y-auto backdrop-blur-lg flex flex-col gap-2"
              >
                {searchVal.trim() === '' && (
                  <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest font-mono mb-1 px-1">
                    🔥 Recommended Hits
                  </div>
                )}

                {isSearching ? (
                  <div className="py-12 text-center text-xs text-gray-500 font-mono animate-pulse">Searching music archives...</div>
                ) : (searchVal.trim() !== '' && searchResults.length === 0) ? (
                  <div className="py-12 text-center text-xs text-gray-500 italic">No songs found. Try: Arijit Singh, KK, English hits...</div>
                ) : (
                  (searchVal.trim() !== '' ? searchResults : trendingSongs).map(song => (
                    <div
                      key={song.id}
                      className="group flex items-center justify-between p-2.5 hover:bg-white/5 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-white/5"
                    >
                      {/* Play Action */}
                      <div
                        className="flex items-center gap-3.5 min-w-0 flex-1"
                        onClick={() => {
                          playSong(song);
                          setShowSearchResults(false);
                          setSearchVal('');
                        }}
                      >
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 flex items-center justify-center shrink-0">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-200 truncate group-hover:text-white">{song.title}</div>
                          <div className="text-[10px] text-gray-400 truncate mt-0.5">{song.artist}</div>
                        </div>
                      </div>

                      {/* Side controls */}
                      <div className="flex items-center gap-2">
                        {/* Like */}
                        <button
                          onClick={() => toggleFavorite(song)}
                          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-rose-500 transition-colors"
                        >
                          <Heart className={`w-3.5 h-3.5 ${favorites.some(f => f.id === song.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                        
                        {/* Add Queue */}
                        <button
                          onClick={() => addToQueue(song)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-450 text-[10px] font-black transition-all"
                        >
                          + Queue
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop View Layout (lg and up) */}
        <div className="hidden lg:flex flex-row gap-5 items-stretch flex-1 overflow-hidden min-h-0">
          <MusicSidebar />
          
          {/* Central Main Panel - Replaces stationary player with Library details / Main dashboard */}
          <div className="flex-1 glass-panel border border-white/5 rounded-3xl p-6 flex flex-col overflow-y-auto relative shadow-2xl min-h-0">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
            
            <h2 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono mb-4 relative z-10">
              Music Party Arena Dashboard
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
              {/* Quick Instructions / Setup */}
              <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/20">
                <h3 className="font-display font-bold text-sm text-white mb-2">⚡ Quick Setup</h3>
                <ul className="text-xs text-gray-450 space-y-2 list-disc pl-4 leading-relaxed">
                  <li>Use the <strong>Top Search Bar</strong> at any time to find full tracks instantly.</li>
                  <li>Click a track title to play. It appears in the collapsed mini-player bar at the bottom.</li>
                  <li>Click the bottom mini-player bar to expand the <strong>spinning disc player</strong> and view participant positions.</li>
                  <li>In Room Mode, invite codes and invite links are located in the Queue sidebar.</li>
                </ul>
              </div>

              {/* Lobbies Info Card */}
              <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/20 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-white mb-1.5">👥 Real-Time Syncing</h3>
                  <p className="text-xs text-gray-450 leading-relaxed">
                    Rooms support up to 5 members. The Host holds permissions to sync playing tracks, pauses, skips, and queue shifts.
                  </p>
                </div>
                {!isRoomMode ? (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    variant="primary"
                    className="mt-3 gap-1 px-4 py-2 text-xs font-bold w-full bg-gradient-to-r from-emerald-500 to-purple-600 cursor-pointer shadow-md"
                  >
                    Create Lobbies Room
                  </Button>
                ) : (
                  <div className="text-[10px] text-emerald-450 font-mono mt-3 uppercase tracking-wider">
                    ✔ Connected to room {room?.id}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Box (Shown in center if room is active to make UI feel very cozy and complete) */}
            {isRoomMode && (
              <div className="flex-1 mt-5 min-h-[220px] flex flex-col">
                <MusicChat />
              </div>
            )}

            {/* Seeded Default Playlists Grid (Spotify Style Home Screen) */}
            {playlists.length > 0 && (
              <div className="mt-6 relative z-10 select-none">
                <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono mb-3">
                  🎵 Curated Music Stations
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {playlists.map(pl => {
                    let icon = '🇮🇳';
                    if (pl.name.includes('Punjabi')) icon = '🕺';
                    else if (pl.name.includes('Romantic')) icon = '💖';
                    else if (pl.name.includes('English') || pl.name.includes('Pop')) icon = '🇺🇸';

                    return (
                      <div
                        key={pl._id}
                        onClick={() => {
                          playPlaylist(pl.songs);
                          setIsPlayerExpanded(true);
                          addToast(`Playing station: "${pl.name}"`, 'success');
                        }}
                        className="group bg-slate-900/30 border border-white/5 p-4 rounded-2xl hover:bg-slate-900/60 hover:border-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex flex-col items-center text-center shadow-lg"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-purple-600/20 flex items-center justify-center text-xl mb-2.5 shadow-md border border-white/5 group-hover:scale-105 transition-transform">
                          {icon}
                        </div>
                        <div className="text-xs font-bold text-gray-200 group-hover:text-white truncate max-w-full leading-tight">{pl.name}</div>
                        <div className="text-[9px] text-gray-500 font-mono tracking-wider uppercase mt-1 font-bold">{pl.songs.length} Tracks</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <MusicQueue />
        </div>

        {/* Mobile/Tablet Layout (Toggled Tabs) */}
        <div className="lg:hidden flex flex-col flex-1 gap-4 overflow-hidden min-h-0">
          {/* Mobile Tabs selector - Removed "Player" tab since player is now a bottom sheet */}
          <div className="flex bg-slate-950/40 p-1.5 rounded-2xl border border-white/5 select-none shrink-0 gap-1">
            {[
              { id: 'library', label: 'Library', icon: ListMusic },
              { id: 'queue', label: 'Queue', icon: Users },
              ...(isRoomMode ? [{ id: 'chat', label: 'Chat', icon: MessageSquare }] : [])
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = mobileTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMobileTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer
                    ${isActive 
                      ? 'bg-gradient-to-r from-emerald-500/10 to-purple-500/10 border border-white/10 text-white shadow-md' 
                      : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Mobile Panels */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <AnimatePresence mode="wait">
              {mobileTab === 'library' && (
                <motion.div
                  key="mob-lib"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="h-full"
                >
                  <MusicSidebar />
                </motion.div>
              )}
              {mobileTab === 'queue' && (
                <motion.div
                  key="mob-queue"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="h-full"
                >
                  <MusicQueue />
                </motion.div>
              )}
              {mobileTab === 'chat' && isRoomMode && (
                <motion.div
                  key="mob-chat"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="h-full"
                >
                  <MusicChat />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* --- Spotify-Style Bottom Mini Player Bar --- */}
        {currentSong && !isPlayerExpanded && (
          <div
            onClick={() => setIsPlayerExpanded(true)}
            className="fixed bottom-20 left-4 right-4 md:left-6 md:right-6 max-w-4xl mx-auto z-40 glass-panel border border-emerald-500/25 rounded-2xl p-3 flex items-center justify-between shadow-2xl cursor-pointer hover:border-emerald-500/40 hover:scale-[1.01] transition-all select-none animate-none"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className={`w-8.5 h-8.5 rounded-full bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-md
                ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}
              >
                📻
              </div>
              <div className="min-w-0 flex-1 pr-4">
                <div className="text-xs font-black text-gray-200 truncate">{currentSong.title}</div>
                <div className="text-[10px] text-gray-400 truncate mt-0.5">{currentSong.artist}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={togglePlay}
                className="p-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white transition-colors cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4.5 h-4.5 fill-current" /> : <Play className="w-4.5 h-4.5 fill-current ml-0.5" />}
              </button>
              
              <button
                onClick={nextSong}
                className="p-2 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white transition-colors cursor-pointer"
                title="Next Song"
              >
                <SkipForward className="w-4.5 h-4.5 fill-current" />
              </button>
            </div>
          </div>
        )}

      </main>

      <BottomNav />

      {/* --- Full-Screen Popup Player Sheet (Spotify Style) --- */}
      <AnimatePresence>
        {isPlayerExpanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPlayerExpanded(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            
            {/* Slide-Up Player Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 100 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-xl z-10"
            >
              <MusicPlayer />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Room Modal */}
      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Toast Manager Overlay */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 pointer-events-none select-none max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`p-3.5 px-5 rounded-2xl border text-xs font-bold text-white shadow-2xl flex items-center gap-2.5 pointer-events-auto backdrop-blur-md
                ${toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/20 text-emerald-350 shadow-emerald-500/5' : ''}
                ${toast.type === 'error' ? 'bg-rose-950/80 border-rose-500/20 text-rose-350 shadow-rose-500/5' : ''}
                ${toast.type === 'info' ? 'bg-slate-950/80 border-white/10 text-gray-200' : ''}`}
            >
              <button
                onClick={() => removeToast(toast.id)}
                className="text-[9px] hover:text-white cursor-pointer select-none font-bold"
              >
                ✕
              </button>
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function MusicRoomPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#06070a] relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full filter blur-[120px] pointer-events-none" />
        <Loader size="lg" text="Entering Music Hub..." />
      </div>
    }>
      <MusicRoomPageContent />
    </Suspense>
  );
}
