import React, { useEffect, useState } from 'react';
import { useMusicStore, Song } from '../../store/useMusicStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Play, Pause, Square, SkipForward, SkipBack, Shuffle, Repeat, Volume2, VolumeX, FastForward, Rewind, ChevronDown, Download, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export const MusicPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    isShuffle,
    isRepeat,
    togglePlay,
    stop,
    setVolume,
    toggleMute,
    seek,
    skipForward10,
    skipBackward10,
    nextSong,
    prevSong,
    toggleShuffle,
    toggleRepeat,
    isRoomMode,
    room,
    setIsPlayerExpanded,
    favorites,
    toggleFavorite
  } = useMusicStore();

  const { user } = useAuthStore();
  const [sliderVal, setSliderVal] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Sync internal slider value to progress state
  useEffect(() => {
    if (!isSeeking) {
      setSliderVal(progress);
    }
  }, [progress, isSeeking]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderVal(parseFloat(e.target.value));
  };

  const handleSliderMouseUp = () => {
    setIsSeeking(false);
    seek(sliderVal);
  };

  const handleSliderTouchEnd = () => {
    setIsSeeking(false);
    seek(sliderVal);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getPastelColors = (name: string) => {
    const colors = [
      { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30' },
      { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
      { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/30' },
      { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' },
      { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
      { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  };

  // Avatar layout configurations
  const getAvatarPositions = (count: number) => {
    switch (count) {
      case 2:
        return [
          { top: '15px', left: '50%', transform: 'translateX(-50%)' }, // Top
          { bottom: '15px', left: '50%', transform: 'translateX(-50%)' } // Bottom
        ];
      case 3:
        return [
          { top: '25px', left: '20px' }, // Top Left
          { top: '25px', right: '20px' }, // Top Right
          { bottom: '15px', left: '50%', transform: 'translateX(-50%)' } // Bottom Center
        ];
      case 4:
        return [
          { top: '25px', left: '20px' }, // Top Left
          { top: '25px', right: '20px' }, // Top Right
          { bottom: '25px', left: '20px' }, // Bottom Left
          { bottom: '25px', right: '20px' } // Bottom Right
        ];
      case 5:
        return [
          { top: '25px', left: '15px' }, // Top Left
          { top: '15px', left: '50%', transform: 'translateX(-50%)' }, // Top Center
          { top: '25px', right: '15px' }, // Top Right
          { bottom: '25px', left: '60px' }, // Bottom Left
          { bottom: '25px', right: '60px' } // Bottom Right
        ];
      default:
        return [];
    }
  };

  const renderAvatars = () => {
    if (!isRoomMode || !room) return null;
    const count = room.players.length;
    if (count <= 1) return null;

    const positions = getAvatarPositions(count);

    return room.players.map((player, idx) => {
      if (idx >= positions.length) return null;
      const colors = getPastelColors(player.username);
      const pos = positions[idx];

      return (
        <div
          key={player.id}
          style={pos}
          className="absolute z-20 flex flex-col items-center group select-none"
        >
          {/* Avatar Disc */}
          <div className={`w-11 h-11 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center font-black ${colors.text} text-sm uppercase shadow-lg shadow-black/30 group-hover:scale-110 transition-transform relative`}>
            {player.username.charAt(0)}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#090a0f]" />
          </div>

          {/* User Details Tooltip */}
          <div className="absolute top-full mt-1 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 bg-slate-950/95 border border-white/10 rounded-xl px-2.5 py-1.5 text-center transition-all duration-200 pointer-events-none z-30 shadow-2xl w-32 leading-tight">
            <div className="text-[10px] font-bold text-white truncate">{player.username}</div>
            <div className="text-[8px] text-emerald-450 font-mono tracking-wider mt-0.5 uppercase">✔ Online</div>
            {player.currentlyListening && (
              <div className="text-[8px] text-gray-400 mt-1 truncate max-w-full">
                🎧 {player.currentlyListening}
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  const progressPercent = duration > 0 ? (sliderVal / duration) * 100 : 0;
  const isControlsAllowed = !isRoomMode || room?.allowEveryoneControl || (room && room.hostId === user?.id);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[480px] w-full relative max-w-xl mx-auto px-4 select-none">
      
      {/* Avatars Overlay layout */}
      {renderAvatars()}

      {/* Music Player Panel */}
      <div className="w-full glass-panel border border-white/10 rounded-[40px] p-6 flex flex-col items-center justify-between gap-6 relative shadow-2xl overflow-hidden min-h-[400px]">
        {/* Minimize Button */}
        <button
          onClick={() => setIsPlayerExpanded(false)}
          className="absolute top-4 left-4 z-30 p-1.5 rounded-xl hover:bg-white/5 border border-white/5 text-gray-400 hover:text-white cursor-pointer transition-colors"
          title="Minimize Player"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Animated Glow Border */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/40 via-purple-500/40 to-emerald-500/40 opacity-70 animate-pulse" />

        {/* Center Vinyl Disc / Visualizer Area */}
        <div className="flex flex-col items-center justify-center relative w-full mt-2 flex-1">
          <div className={`w-36 h-36 rounded-full border-4 border-slate-950/80 bg-slate-950/60 flex items-center justify-center shadow-2xl shadow-purple-500/5 relative overflow-hidden group
            ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}
          >
            {/* Album Cover Background */}
            {currentSong?.artworkUrl100 && (
              <img 
                src={currentSong.artworkUrl100} 
                alt={currentSong.title} 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" 
              />
            )}

            {/* Center Pin */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-purple-600 border border-white/20 z-10 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#090a0f]" />
            </div>

            {/* Groove Lines */}
            <div className="absolute inset-2 border border-white/5 rounded-full" />
            <div className="absolute inset-6 border border-white/5 rounded-full" />
            <div className="absolute inset-10 border border-white/5 rounded-full" />
            <div className="absolute inset-14 border border-white/5 rounded-full" />
          </div>

          {/* EQ Bar Visualizer */}
          <div className="flex gap-1 items-end h-8 mt-4 select-none">
            {[1, 2, 3, 4, 5, 6, 7].map((bar) => {
              const animDuration = 0.5 + Math.random() * 0.5;
              return (
                <div
                  key={bar}
                  style={{
                    animationDuration: `${animDuration}s`,
                    height: isPlaying ? '100%' : '3px'
                  }}
                  className={`w-1 rounded-t-sm bg-gradient-to-t from-purple-500 to-emerald-400
                    ${isPlaying ? 'animate-[pulse_1.2s_infinite_ease-in-out]' : 'h-[3px] transition-all'}`}
                />
              );
            })}
          </div>
        </div>

        {/* Song Info */}
        <div className="text-center w-full max-w-sm">
          {currentSong ? (
            <>
              <h2 className="font-display font-extrabold text-base md:text-lg text-white truncate tracking-wide px-4 drop-shadow-md">
                {currentSong.title}
              </h2>
              <p className="text-xs text-gray-400 mt-1 truncate px-4">
                {currentSong.artist}
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display font-bold text-sm md:text-base text-gray-500 tracking-wider">
                NO SONG PLAYING
              </h2>
              <p className="text-[10px] text-gray-600 mt-1 font-mono uppercase tracking-widest">
                Search or select a track to begin
              </p>
            </>
          )}
        </div>

        {/* Progress Slider */}
        <div className="w-full space-y-1 px-4">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max={duration || 30}
              step="0.05"
              value={sliderVal}
              disabled={!currentSong || !isControlsAllowed}
              onMouseDown={() => setIsSeeking(true)}
              onTouchStart={() => setIsSeeking(true)}
              onChange={handleSliderChange}
              onMouseUp={handleSliderMouseUp}
              onTouchEnd={handleSliderTouchEnd}
              style={{
                background: `linear-gradient(to right, #10b981 0%, #8b5cf6 ${progressPercent}%, #1e293b ${progressPercent}%, #1e293b 100%)`
              }}
              className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono select-none pl-1 pr-1 font-bold">
            <span>{formatTime(sliderVal)}</span>
            <span>-{formatTime(Math.max((duration || 30) - sliderVal, 0))}</span>
          </div>
        </div>

        {/* Main Controls Panel - 3 Buttons Layout (Prev, Play/Pause, Next) */}
        <div className="flex items-center justify-center gap-6 w-full max-w-sm px-6">
          {/* Like */}
          <button
            onClick={() => currentSong && toggleFavorite(currentSong)}
            disabled={!currentSong}
            className={`p-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-30
              ${currentSong && favorites.some(f => f.id === currentSong.id) ? 'text-rose-500 hover:text-rose-450' : 'text-gray-400 hover:text-white'}`}
            title="Like Song"
          >
            <Heart className={`w-5 h-5 ${currentSong && favorites.some(f => f.id === currentSong.id) ? 'fill-current' : ''}`} />
          </button>

          {/* Prev */}
          <button
            onClick={prevSong}
            disabled={!currentSong || !isControlsAllowed || isRoomMode}
            className="p-2.5 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
            title="Previous Song"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Play/Pause (Central circle) */}
          <button
            onClick={togglePlay}
            disabled={!currentSong || !isControlsAllowed}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-purple-600 hover:scale-105 active:scale-95 transition-all text-white flex items-center justify-center shadow-lg shadow-purple-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
          </button>

          {/* Next */}
          <button
            onClick={nextSong}
            disabled={!currentSong || !isControlsAllowed}
            className="p-2.5 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
            title="Next Song"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Download */}
          <button
            onClick={() => {
              if (currentSong) {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                const downloadUrl = `${apiBaseUrl}/music/download?url=${encodeURIComponent(currentSong.previewUrl)}&filename=${encodeURIComponent(currentSong.title + ' - ' + currentSong.artist)}`;
                window.open(downloadUrl, '_blank');
              }
            }}
            disabled={!currentSong}
            className="p-2.5 rounded-xl text-gray-400 hover:text-emerald-450 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Download Track"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Volume & Mute Panel */}
        <div className="flex items-center justify-center gap-3 w-full max-w-xs px-4 border-t border-white/5 pt-4 mb-2 select-none">
          <button
            onClick={toggleMute}
            className="text-gray-500 hover:text-white transition-colors cursor-pointer"
            title="Mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-450" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${(isMuted ? 0 : volume) * 100}%, #1e293b ${(isMuted ? 0 : volume) * 100}%, #1e293b 100%)`
            }}
            className="w-32 h-1 rounded-lg appearance-none cursor-pointer focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
