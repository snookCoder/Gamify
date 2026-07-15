'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { 
  Disc, 
  HelpCircle, 
  CheckCircle2, 
  Music, 
  Award, 
  Trophy, 
  Send,
  XCircle,
  Play,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BoardProps {
  board: any; // GuessTheSongBoard
  makeMove: (payload: any) => void;
  turn: string;
  myUserId: string;
  players: any[];
  winner: string | null;
}

const CircularTimer = ({ timeLeft, maxTime }: { timeLeft: number; maxTime: number }) => {
  const percent = maxTime > 0 ? (timeLeft / maxTime) * 100 : 0;
  const strokeDashoffset = 113 - (113 * percent) / 100;

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="28"
          cy="28"
          r="18"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="3.5"
          fill="transparent"
        />
        <motion.circle
          cx="28"
          cy="28"
          r="18"
          stroke={timeLeft <= 3 ? '#ef4444' : '#8b5cf6'}
          strokeWidth="3.5"
          fill="transparent"
          strokeDasharray="113"
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.2, ease: 'linear' }}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute text-lg font-black font-mono tracking-tight ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-gray-200'}`}>
        {timeLeft}
      </span>
    </div>
  );
};

const Equalizer = ({ isPlaying }: { isPlaying: boolean }) => {
  const bars = Array.from({ length: 15 });
  return (
    <div className="flex items-end justify-center gap-1.5 h-10 w-full select-none pointer-events-none">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          animate={
            isPlaying
              ? { height: [8, Math.floor(Math.random() * 24) + 12, 8] }
              : { height: 8 }
          }
          transition={{
            duration: 0.8 + Math.random() * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-1.5 rounded-full bg-gradient-to-t from-violet-600 via-fuchsia-500 to-cyan-400"
        />
      ))}
    </div>
  );
};

export default function GuessTheSong({
  board,
  makeMove,
  turn,
  myUserId,
  players,
  winner,
}: BoardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Guest Lobby Search Playlist State
  const [songCategory, setSongCategory] = useState('Pop');
  const [songCustomSearch, setSongCustomSearch] = useState('');
  const [fetchedSongs, setFetchedSongs] = useState<any[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  // Option Click state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const isGuest = myUserId === board.guestId;
  const isHost = myUserId === board.hostId;

  // Determine active song & active guess values
  const currentSong = board.phase === 'guessing_b' 
    ? board.songsB[board.currentSongIndex] 
    : board.songsA[board.currentSongIndex];

  const myCorrectGuess = board.phase === 'guessing_b'
    ? board.guessesB[board.currentSongIndex]
    : board.guessesA[board.currentSongIndex];

  const isMyGuessingTurn = (board.phase === 'guessing_b' && isGuest) || (board.phase === 'guessing_a' && isHost);

  // Clear local selected option between rounds
  useEffect(() => {
    setSelectedOption(null);
  }, [board.currentSongIndex, board.phase]);

  // Audio Playback Securing
  useEffect(() => {
    if (!currentSong || board.status !== 'playing') {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(currentSong.previewUrl);
    audioRef.current = audio;
    audio.volume = 0.5;

    const playAudio = async () => {
      try {
        audio.currentTime = board.previewStartOffset;
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Audio playback blocked or failed:', err);
      }
    };

    playAudio();

    const checkTimeout = setInterval(() => {
      if (audio.currentTime >= board.previewStartOffset + board.difficultyDuration) {
        audio.pause();
        setIsPlaying(false);
        clearInterval(checkTimeout);
      }
    }, 100);

    return () => {
      clearInterval(checkTimeout);
      audio.pause();
      setIsPlaying(false);
    };
  }, [currentSong, board.currentSongIndex, board.status, board.phase]);

  // Guest Challenge Search Playlist fetch
  useEffect(() => {
    if (board.phase === 'lobby_a' && isGuest) {
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
              artworkUrl: t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg') : '',
              options: []
            }));
          setFetchedSongs(validSongs);
          setSelectedSongIds(validSongs.slice(0, 5).map((s: any) => s.id));
        } catch (err) {
          console.error('Error fetching lobby songs:', err);
        } finally {
          setLoadingSongs(false);
        }
      };

      fetchSongsLobby();
    }
  }, [songCategory, songCustomSearch, board.phase, isGuest]);

  // 1. Lobby_a layout for Guest/Host
  if (board.phase === 'lobby_a') {
    if (isHost) {
      return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8 bg-slate-950/40 border border-white/5 rounded-3xl min-h-[460px] text-center shadow-2xl relative overflow-hidden select-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/5 rounded-full filter blur-[80px] pointer-events-none" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="text-6xl mb-6 select-none"
          >
            💿
          </motion.div>
          <h2 className="font-display font-black text-2xl text-white">Opponent Curating Playlist...</h2>
          <p className="text-sm text-gray-400 mt-2 max-w-sm leading-relaxed">
            Player B (Guest) is choosing 5 songs to challenge you. Get ready, you will guess their songs in the next phase!
          </p>
        </div>
      );
    }

    const songsToPlay = fetchedSongs.filter((s) => selectedSongIds.includes(s.id));

    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center p-6 bg-slate-950/40 border border-white/5 rounded-3xl min-h-[460px] text-center shadow-2xl relative select-none">
        <div className="absolute top-12 left-12 w-64 h-64 bg-violet-600/5 rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full mb-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">Curate Playlist</span>
        </div>
        <h2 className="font-display font-black text-2xl text-white">Challenge the Host!</h2>
        <p className="text-xs text-gray-400 max-w-md mt-1 leading-relaxed">
          Select exactly 5 songs below. The host will have to listen to the previews and guess their titles!
        </p>

        {/* Search selectors */}
        <div className="w-full max-w-md flex flex-col gap-3 my-4">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] text-gray-500 font-bold uppercase">Category</label>
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
              <label className="text-[10px] text-gray-500 font-bold uppercase">Custom Search Term</label>
              <input
                type="text"
                value={songCustomSearch}
                onChange={(e) => setSongCustomSearch(e.target.value)}
                placeholder="Artist, album or song..."
                className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-violet-500"
              />
            </div>
          )}

          {/* Checklist */}
          <div className="flex flex-col gap-1.5 text-left border-t border-white/5 pt-3">
            <label className="text-[10px] text-gray-400 font-bold uppercase flex justify-between">
              <span>Choose 5 Tracks ({selectedSongIds.length}/5 selected)</span>
            </label>
            
            {loadingSongs ? (
              <div className="text-[10px] text-gray-500 py-8 text-center animate-pulse">Loading iTunes tracks...</div>
            ) : fetchedSongs.length === 0 ? (
              <div className="text-[10px] text-gray-500 py-8 text-center">No songs found. Change category.</div>
            ) : (
              <div className="max-h-[160px] overflow-y-auto border border-white/5 bg-slate-950/60 rounded-lg p-2.5 flex flex-col gap-1.5 scrollbar-thin">
                {fetchedSongs.map((song) => {
                  const isChecked = selectedSongIds.includes(song.id);
                  return (
                    <label 
                      key={song.id} 
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-violet-600/10' : 'hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedSongIds.length >= 5) return;
                              setSelectedSongIds((prev) => [...prev, song.id]);
                            } else {
                              setSelectedSongIds((prev) => prev.filter((id) => id !== song.id));
                            }
                          }}
                          disabled={!isChecked && selectedSongIds.length >= 5}
                          className="accent-violet-500 w-3.5 h-3.5 cursor-pointer disabled:opacity-40"
                        />
                        <img src={song.artworkUrl} className="w-5.5 h-5.5 rounded object-cover shrink-0" />
                        <div className="flex flex-col leading-tight truncate text-left">
                          <span className="text-[10px] font-black text-white truncate max-w-[200px]">{song.title}</span>
                          <span className="text-[8px] text-gray-400 truncate max-w-[200px]">{song.artist}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Button
          variant="primary"
          disabled={selectedSongIds.length !== 5}
          onClick={() => {
            makeMove({
              action: 'submitChallengeSongs',
              songs: songsToPlay
            });
          }}
          className="w-full max-w-md mt-2 flex items-center justify-center gap-1.5 py-3.5 cursor-pointer"
        >
          Send Challenge <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  // 2. Finished Game screen
  if (board.phase === 'finished') {
    const hostPlayer = players.find(p => p.id === board.hostId);
    const guestPlayer = players.find(p => p.id === board.guestId);

    let correctB = 0;
    let timeB = 0;
    for (let i = 0; i < 5; i++) {
      const g = board.guessesB[i];
      if (g) {
        if (g.isCorrect) correctB++;
        timeB += g.timeTaken;
      } else {
        timeB += 8000;
      }
    }

    let correctA = 0;
    let timeA = 0;
    for (let i = 0; i < 5; i++) {
      const g = board.guessesA[i];
      if (g) {
        if (g.isCorrect) correctA++;
        timeA += g.timeTaken;
      } else {
        timeA += 8000;
      }
    }

    const hostWinner = winner === board.hostId;
    const guestWinner = winner === board.guestId;
    const isDraw = winner === 'draw' || !winner;

    return (
      <div className="flex flex-col items-center w-full max-w-3xl mx-auto px-4 py-8 relative select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/5 rounded-full filter blur-[100px] pointer-events-none" />

        <div className="text-center mb-10 z-10">
          <div className="bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 rounded-full inline-block mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">Duel Completed</span>
          </div>
          <h1 className="font-display font-black text-3xl tracking-wide text-white uppercase">Duel Standings</h1>
        </div>

        {/* Duel Comparative Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-10 z-10">
          {/* Host Card */}
          <div className={`p-6 rounded-3xl border flex flex-col items-center text-center shadow-xl transition-all ${hostWinner ? 'bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5' : isDraw ? 'bg-slate-900/40 border-white/5' : 'bg-slate-950/20 border-white/5 opacity-75'}`}>
            <div className="text-4xl mb-3">{hostWinner ? '👑' : '👾'}</div>
            <h3 className="font-display font-black text-lg text-white truncate max-w-xs">{hostPlayer?.username || 'Host'}</h3>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Host (Player A)</span>
            
            <div className="w-full border-t border-white/5 my-4 pt-4 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-semibold">Correct Answers</span>
                <span className="font-mono font-black text-white">{correctA} / 5</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-semibold">Total Guessing Time</span>
                <span className="font-mono font-black text-white">{(timeA / 1000).toFixed(2)}s</span>
              </div>
            </div>
            
            {hostWinner ? (
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/15 px-3 py-1 rounded-full">🏆 Winner</span>
            ) : isDraw ? (
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-500/10 px-3 py-1 rounded-full">🤝 Draw</span>
            ) : (
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-slate-900/50 px-3 py-1 rounded-full">Defeat</span>
            )}
          </div>

          {/* Guest Card */}
          <div className={`p-6 rounded-3xl border flex flex-col items-center text-center shadow-xl transition-all ${guestWinner ? 'bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5' : isDraw ? 'bg-slate-900/40 border-white/5' : 'bg-slate-950/20 border-white/5 opacity-75'}`}>
            <div className="text-4xl mb-3">{guestWinner ? '👑' : '👾'}</div>
            <h3 className="font-display font-black text-lg text-white truncate max-w-xs">{guestPlayer?.username || 'Guest'}</h3>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Guest (Player B)</span>
            
            <div className="w-full border-t border-white/5 my-4 pt-4 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-semibold">Correct Answers</span>
                <span className="font-mono font-black text-white">{correctB} / 5</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-semibold">Total Guessing Time</span>
                <span className="font-mono font-black text-white">{(timeB / 1000).toFixed(2)}s</span>
              </div>
            </div>
            
            {guestWinner ? (
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/15 px-3 py-1 rounded-full">🏆 Winner</span>
            ) : isDraw ? (
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-500/10 px-3 py-1 rounded-full">🤝 Draw</span>
            ) : (
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-slate-900/50 px-3 py-1 rounded-full">Defeat</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Main playing visualizer & option click layout
  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 px-4 py-3 select-none">
      
      {/* Playfield Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950/40 border border-white/5 rounded-3xl relative overflow-hidden min-h-[460px] shadow-xl">
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-violet-600/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-cyan-600/5 rounded-full filter blur-3xl pointer-events-none" />

        {/* Top details bar */}
        <div className="w-full flex items-center justify-between mb-8 z-10">
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[9px] text-violet-400 font-black uppercase tracking-widest font-mono">
              Category: {board.category} • {board.phase === 'guessing_b' ? 'PHASE 1 (Guest Guessing)' : 'PHASE 2 (Host Guessing)'}
            </span>
            <span className="text-lg font-display font-black text-gray-100">
              ROUND {board.currentSongIndex + 1} <span className="text-xs font-mono text-gray-500">/ 5</span>
            </span>
          </div>
          <CircularTimer timeLeft={board.status === 'reveal' ? 2 : Math.max(0, Math.ceil(board.difficultyDuration - (Date.now() - board.songStartTime) / 1000))} maxTime={board.status === 'reveal' ? 2 : board.difficultyDuration} />
        </div>

        {/* Dynamic CD Cover or spinning vinyl */}
        <div className="relative w-40 h-40 flex items-center justify-center my-3 z-10 select-none">
          <AnimatePresence mode="wait">
            {board.status === 'playing' ? (
              <motion.div
                key="spinning-vinyl"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="w-full h-full flex flex-col items-center justify-center"
              >
                <motion.div
                  animate={isPlaying ? { rotate: 360 } : {}}
                  transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
                  className="w-32 h-32 rounded-full bg-slate-900 border-4 border-slate-800 shadow-2xl flex items-center justify-center relative cursor-not-allowed"
                >
                  <Disc className="w-10 h-10 text-violet-500/85 animate-pulse" />
                  <div className="absolute inset-0 bg-transparent flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#08090d] border-2 border-slate-900" />
                  </div>
                </motion.div>
                <div className="mt-5 w-full">
                  <Equalizer isPlaying={isPlaying} />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="revealed-cover"
                initial={{ scale: 0.85, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-violet-500/30 shadow-[0_0_35px_rgba(139,92,246,0.2)] relative"
              >
                {currentSong?.artworkUrl ? (
                  <img
                    src={currentSong.artworkUrl}
                    alt={currentSong.title}
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <Music className="w-12 h-12 text-gray-700" />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Central banner details */}
        <div className="text-center mt-5 mb-6 w-full max-w-md z-10">
          <AnimatePresence mode="wait">
            {board.status === 'playing' ? (
              <motion.div
                key="guessing-status"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center"
              >
                {myCorrectGuess ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider rounded-full shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Checked! Waiting...
                  </div>
                ) : isMyGuessingTurn ? (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-black uppercase tracking-widest animate-pulse">
                    <HelpCircle className="w-3.5 h-3.5 animate-bounce" /> Your Turn: Choose the Song!
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold uppercase tracking-widest">
                    <Music className="w-3.5 h-3.5 animate-pulse" /> Opponent is guessing...
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="revealed-details"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col items-center"
              >
                <span className="text-base font-display font-black text-white tracking-wide">{currentSong?.title}</span>
                <span className="text-xs text-violet-400 font-bold mt-0.5">{currentSong?.artist}</span>
                <span className="text-[8px] text-gray-500 font-mono mt-1 uppercase tracking-widest">{currentSong?.album}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2x2 Multiple Choice Button Grid */}
        <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 z-10">
          {currentSong?.options?.map((option: string, idx: number) => {
            const isCorrect = option === currentSong.title;
            const isMySelected = selectedOption === option;
            const hasGuessedAny = selectedOption !== null || !!myCorrectGuess;
            const revealMode = board.status === 'reveal';
            
            let btnStyle = "bg-slate-900/60 border-white/5 text-gray-200 hover:bg-slate-800/80 hover:border-violet-500/30";
            
            if (revealMode) {
              if (isCorrect) {
                btnStyle = "bg-emerald-600/90 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.25)]";
              } else if (isMySelected) {
                btnStyle = "bg-red-600/90 border-red-500 text-white";
              } else {
                btnStyle = "bg-slate-950/40 border-white/5 text-gray-500 opacity-40 cursor-not-allowed";
              }
            } else if (hasGuessedAny) {
              if (isCorrect) {
                btnStyle = "bg-emerald-600/90 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.25)]";
              } else if (isMySelected) {
                btnStyle = "bg-red-600/90 border-red-500 text-white";
              } else {
                btnStyle = "bg-slate-950/40 border-white/5 text-gray-500 opacity-40 cursor-not-allowed";
              }
            } else if (!isMyGuessingTurn) {
              btnStyle = "bg-slate-950/20 border-white/5 text-gray-500 opacity-50 cursor-not-allowed";
            }

            const handleClickOption = () => {
              if (!isMyGuessingTurn || hasGuessedAny || board.status !== 'playing') return;
              setSelectedOption(option);
              makeMove({ action: 'guess', guess: option });
            };

            const choiceEmojis = ['🔺', '🔷', '🟢', '🟡'];
            const choiceEmoji = choiceEmojis[idx % 4];

            return (
              <Button
                key={idx}
                disabled={!isMyGuessingTurn || hasGuessedAny || board.status !== 'playing'}
                onClick={handleClickOption}
                className={`py-3.5 px-5 text-left flex items-center justify-start gap-3 rounded-2xl text-xs font-black tracking-wide border transition-all duration-200 min-h-[56px] w-full cursor-pointer ${btnStyle}`}
              >
                <span className="text-sm shrink-0 select-none">{choiceEmoji}</span>
                <span className="truncate">{option}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Symmetrical Duel Scoreboard (Side columns) */}
      <div className="w-full lg:w-72 bg-slate-950/40 border border-white/5 rounded-3xl p-5 shadow-xl shrink-0 flex flex-col gap-4">
        <div className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider flex justify-between border-b border-white/5 pb-2">
          <span>Duel Status</span>
          <span className="text-[9px] font-mono font-bold text-violet-400">Round {board.currentSongIndex + 1}/5</span>
        </div>

        {/* Players List with Correct Checks & Times */}
        <div className="flex flex-col gap-3">
          {players.map((player) => {
            const isPlayerHost = player.id === board.hostId;
            const pGuesses = isPlayerHost ? board.guessesA : board.guessesB;
            
            // Calculate progress score
            let correctCount = 0;
            for (let i = 0; i < 5; i++) {
              if (pGuesses[i]?.isCorrect) correctCount++;
            }

            const isCurrentGuessing = (board.phase === 'guessing_b' && !isPlayerHost) || (board.phase === 'guessing_a' && isPlayerHost);

            return (
              <div
                key={player.id}
                className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all ${isCurrentGuessing ? 'bg-violet-600/5 border-violet-500/20' : 'bg-slate-900/30 border-white/5'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs bg-slate-900 border border-white/5">
                      {isPlayerHost ? '👾' : '🎮'}
                    </div>
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-xs font-black text-gray-100 truncate max-w-[120px]">{player.username}</span>
                      <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">{isPlayerHost ? 'Host' : 'Guest'}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-violet-400">{correctCount} / 5</span>
                </div>

                {/* Micro ticks showing correctness for each of the 5 rounds */}
                <div className="flex gap-1.5 mt-1 border-t border-white/5 pt-2 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const guess = pGuesses[i];
                    const isDone = guess !== undefined;
                    const isRight = guess?.isCorrect;
                    
                    return (
                      <div 
                        key={i}
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border ${
                          !isDone 
                            ? 'bg-slate-900/40 border-white/5 text-gray-600' 
                            : isRight 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}
                        title={isDone ? `Round ${i+1}: ${(guess.timeTaken/1000).toFixed(2)}s` : `Round ${i+1}: Pending`}
                      >
                        {isDone ? (isRight ? '✓' : '✗') : i + 1}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
