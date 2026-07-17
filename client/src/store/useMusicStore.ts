import { create } from 'zustand';
import { useGameStore } from './useGameStore';
import { useAuthStore } from './useAuthStore';
import { api } from '../services/api';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in milliseconds
  previewUrl: string;
  addedBy?: string;
  votes?: Record<string, 'up' | 'down'>;
  voteCount?: number;
}

export interface PlaylistData {
  _id: string;
  name: string;
  songs: Song[];
  createdAt: string;
  updatedAt: string;
}

export interface MusicRoomPlayer {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  socketId: string;
  onlineStatus: 'online' | 'offline';
  currentlyListening: string | null;
}

export interface MusicChatMessage {
  id: string;
  sender: {
    id: string;
    username: string;
    avatar: string;
  } | null;
  message: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface MusicRoom {
  id: string;
  name: string;
  hostId: string;
  maxParticipants: number;
  isPrivate: boolean;
  players: MusicRoomPlayer[];
  queue: Song[];
  playbackState: {
    status: 'playing' | 'paused' | 'stopped';
    currentSong: Song | null;
    progress: number; // in seconds
    lastUpdated: number;
  };
  allowEveryoneControl: boolean;
  chatMessages: MusicChatMessage[];
}

interface MusicStoreState {
  // Audio Instance & Local State
  audio: HTMLAudioElement | null;
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0 to 1
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: boolean;

  // Lists & Persistence
  searchResults: Song[];
  playlists: PlaylistData[];
  favorites: Song[];
  recentHistory: Song[];
  mostPlayed: Song[];
  localQueue: Song[]; // queue for solo mode

  // UI state
  searchQuery: string;
  isSearching: boolean;
  isLoadingLists: boolean;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
  isPlayerExpanded: boolean;
  trendingSongs: Song[];
  
  // Room Mode State
  room: MusicRoom | null;
  isRoomMode: boolean;
  isCreatingRoom: boolean;

  // Actions
  initAudio: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Search & Library Actions
  searchSongs: (query: string) => Promise<void>;
  fetchPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, song: Song) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  reorderPlaylistSongs: (playlistId: string, songs: Song[]) => Promise<void>;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (song: Song) => Promise<void>;
  fetchHistory: () => Promise<void>;
  recordHistory: (song: Song) => Promise<void>;
  fetchTrendingSongs: () => Promise<void>;

  // Solo Playback Controls
  playSong: (song: Song) => void;
  togglePlay: () => void;
  stop: () => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  seek: (seconds: number) => void;
  skipForward10: () => void;
  skipBackward10: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  reorderQueue: (newQueue: Song[]) => void;
  nextSong: () => void;
  prevSong: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playPlaylist: (songs: Song[]) => void;
  setIsPlayerExpanded: (val: boolean) => void;

  // Room Sockets Actions
  createRoom: (roomName: string, maxParticipants: number, isPrivate: boolean) => void;
  joinRoom: (roomCode: string) => void;
  leaveRoom: () => void;
  sendChatMessage: (message: string) => void;
  transferHost: (targetPlayerId: string) => void;
  toggleControl: (allow: boolean) => void;
  voteSong: (songId: string, voteType: 'up' | 'down' | null) => void;
  
  // Real-time listener binder
  setupSocketListeners: () => void;
  cleanupSocketListeners: () => void;
}

export const useMusicStore = create<MusicStoreState>((set, get) => {
  let progressInterval: NodeJS.Timeout | null = null;

  const startProgressTimer = () => {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      const { audio, isPlaying, isRoomMode, room, currentSong } = get();
      if (!audio) return;

      const fallbackDuration = currentSong ? (currentSong.duration / 1000) : 180;

      if (isRoomMode && room && room.playbackState.status === 'playing') {
        // Calculate dynamic progress based on server offset to prevent constant state updates
        const elapsed = (Date.now() - room.playbackState.lastUpdated) / 1000;
        const currentProgress = Math.min(room.playbackState.progress + elapsed, audio.duration || fallbackDuration);
        set({ progress: currentProgress, duration: audio.duration || fallbackDuration });
      } else if (isPlaying) {
        set({ progress: audio.currentTime, duration: audio.duration || fallbackDuration });
      }
    }, 250);
  };

  const stopProgressTimer = () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  };

  return {
    // Initial State
    audio: null,
    currentSong: null,
    isPlaying: false,
    progress: 0,
    duration: 30,
    volume: 0.8,
    isMuted: false,
    isShuffle: false,
    isRepeat: false,
    searchResults: [],
    playlists: [],
    favorites: [],
    recentHistory: [],
    mostPlayed: [],
    localQueue: [],
    trendingSongs: [],
    searchQuery: '',
    isSearching: false,
    isLoadingLists: false,
    toasts: [],
    isPlayerExpanded: false,
    room: null,
    isRoomMode: false,
    isCreatingRoom: false,

    // Toasts Utility
    addToast: (message, type = 'success') => {
      const id = `${Date.now()}_${Math.random()}`;
      set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
      setTimeout(() => get().removeToast(id), 3000);
    },
    removeToast: (id) => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },
    setIsPlayerExpanded: (val) => set({ isPlayerExpanded: val }),

    // Initialize HTML5 Audio Object
    initAudio: () => {
      if (typeof window === 'undefined' || get().audio) return;

      const audio = new Audio();
      audio.volume = get().volume;

      audio.addEventListener('play', () => {
        set({ isPlaying: true });
        startProgressTimer();
      });

      audio.addEventListener('pause', () => {
        set({ isPlaying: false });
        stopProgressTimer();
      });

      audio.addEventListener('ended', () => {
        const { isRepeat, isRoomMode, room, nextSong } = get();
        if (isRepeat) {
          audio.currentTime = 0;
          audio.play().catch(console.error);
        } else {
          if (!isRoomMode) {
            nextSong();
          } else if (room) {
            const currentUserId = useAuthStore.getState().user?.id;
            const isHost = room.hostId === currentUserId;
            if (isHost) {
              nextSong();
            }
          }
        }
      });

      audio.addEventListener('durationchange', () => {
        const { currentSong } = get();
        const fallback = currentSong ? (currentSong.duration / 1000) : 180;
        set({ duration: audio.duration || fallback });
      });

      set({ audio });
    },

    // --- Search & Library Functions ---
    searchSongs: async (query) => {
      if (!query || query.trim() === '') {
        set({ searchResults: [], searchQuery: '' });
        return;
      }
      set({ isSearching: true, searchQuery: query });
      try {
        const data = await api.music.search(query, 'IN');
        const results = (data.results || []).map((t: any) => ({
          id: String(t.trackId),
          title: t.trackName || 'Unknown Song',
          artist: t.artistName || 'Unknown Artist',
          album: t.collectionName || 'Single',
          duration: t.trackTimeMillis || 30000,
          previewUrl: t.previewUrl || '',
        })).filter((s: any) => s.previewUrl);
        set({ searchResults: results });
      } catch (err: any) {
        get().addToast('Search failed: ' + err.message, 'error');
      } finally {
        set({ isSearching: false });
      }
    },

    fetchPlaylists: async () => {
      set({ isLoadingLists: true });
      try {
        const playlists = await api.music.search('', '') as any; // Not used directly, custom fetches
        // Since api helper in api.ts doesn't expose custom routes directly, we fetch via standard fetch with token
        const token = useAuthStore.getState().token;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/music/playlists`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const list = await res.json();
          set({ playlists: list });
        }
      } catch (err) {
        console.error(err);
      } finally {
        set({ isLoadingLists: false });
      }
    },

    createPlaylist: async (name) => {
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/music/playlists`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name })
        });
        if (res.ok) {
          await get().fetchPlaylists();
          get().addToast(`Playlist "${name}" created!`, 'success');
        } else {
          const data = await res.json();
          get().addToast(data.error || 'Failed to create playlist', 'error');
        }
      } catch (err: any) {
        get().addToast(err.message, 'error');
      }
    },

    renamePlaylist: async (id, name) => {
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/music/playlists/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name })
        });
        if (res.ok) {
          await get().fetchPlaylists();
          get().addToast(`Playlist renamed to "${name}"`, 'success');
        }
      } catch (err: any) {
        get().addToast(err.message, 'error');
      }
    },

    deletePlaylist: async (id) => {
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/music/playlists/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          await get().fetchPlaylists();
          get().addToast('Playlist deleted', 'info');
        }
      } catch (err: any) {
        get().addToast(err.message, 'error');
      }
    },

    addSongToPlaylist: async (playlistId, song) => {
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/music/playlists/${playlistId}/songs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(song)
        });
        if (res.ok) {
          await get().fetchPlaylists();
          get().addToast(`Added "${song.title}" to playlist`, 'success');
        } else {
          const data = await res.json();
          get().addToast(data.error || 'Failed to add song', 'error');
        }
      } catch (err: any) {
        get().addToast(err.message, 'error');
      }
    },

    removeSongFromPlaylist: async (playlistId, songId) => {
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/music/playlists/${playlistId}/songs/${songId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          await get().fetchPlaylists();
          get().addToast('Removed song from playlist', 'info');
        }
      } catch (err: any) {
        get().addToast(err.message, 'error');
      }
    },

    reorderPlaylistSongs: async (playlistId, songs) => {
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/music/playlists/${playlistId}/songs/reorder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ songs })
        });
        if (res.ok) {
          await get().fetchPlaylists();
        }
      } catch (err) {
        console.error(err);
      }
    },

    fetchFavorites: async () => {
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/music/favorites`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const favs = await res.json();
          set({ favorites: favs });
        }
      } catch (err) {
        console.error(err);
      }
    },

    toggleFavorite: async (song) => {
      const { favorites } = get();
      const isFav = favorites.some((f) => f.id === song.id);
      const token = useAuthStore.getState().token;

      try {
        if (isFav) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/music/favorites/${song.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            set({ favorites: favorites.filter((f) => f.id !== song.id) });
            get().addToast('Removed from Liked Songs', 'info');
          }
        } else {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/music/favorites`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(song)
          });
          if (res.ok) {
            set({ favorites: [...favorites, song] });
            get().addToast('Added to Liked Songs', 'success');
          }
        }
      } catch (err) {
        console.error(err);
      }
    },

    fetchHistory: async () => {
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/music/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          set({ recentHistory: data.recent || [], mostPlayed: data.mostPlayed || [] });
        }
      } catch (err) {
        console.error(err);
      }
    },

    recordHistory: async (song) => {
      try {
        const token = useAuthStore.getState().token;
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/music/history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(song)
        });
        get().fetchHistory();
      } catch (err) {
        console.error(err);
      }
    },

    fetchTrendingSongs: async () => {
      try {
        const res = await fetch(`https://saavn.sumit.co/api/search/songs?query=Bollywood%20Hits`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data && data.data.results) {
            const songs = data.data.results.map((song: any) => {
              const downloadUrls = song.downloadUrl || [];
              const bestAudio = downloadUrls[downloadUrls.length - 1] || downloadUrls.find((d: any) => d.quality === '160kbps') || {};
              const artistsList = song.artists && song.artists.primary 
                ? song.artists.primary.map((a: any) => a.name).join(', ') 
                : 'Unknown Artist';
              const images = song.image || [];
              const artworkUrl = images[images.length - 1]?.url || '';

              return {
                id: String(song.id),
                title: song.name,
                artist: artistsList,
                album: song.album?.name || 'Single',
                duration: (song.duration || 30) * 1000,
                previewUrl: bestAudio.url || '',
                artworkUrl100: artworkUrl
              };
            });
            set({ trendingSongs: songs.slice(0, 20) });
          }
        }
      } catch (err) {
        console.error('Failed to fetch trending songs:', err);
      }
    },

    // --- Solo Playback Control Logic ---
    playSong: (song) => {
      const { audio, isRoomMode } = get();
      get().initAudio();

      if (isRoomMode) {
        const socket = useGameStore.getState().socket;
        if (socket) {
          socket.emit('music-room:action', {
            action: 'play',
            progress: 0,
            song
          });
        }
        return;
      }

      const activeAudio = audio || get().audio;
      if (!activeAudio) return;

      activeAudio.src = song.previewUrl;
      activeAudio.currentTime = 0;
      activeAudio.play()
        .then(() => {
          set({ currentSong: song, isPlaying: true, progress: 0, duration: song.duration / 1000 });
          get().recordHistory(song);
        })
        .catch((e) => {
          console.error(e);
          get().addToast('Playback failed', 'error');
        });
    },

    togglePlay: () => {
      const { audio, isPlaying, currentSong, isRoomMode } = get();
      if (!currentSong) return;

      if (isRoomMode) {
        const socket = useGameStore.getState().socket;
        if (socket) {
          socket.emit('music-room:action', {
            action: isPlaying ? 'pause' : 'play',
            progress: audio ? audio.currentTime : 0,
            song: currentSong
          });
        }
        return;
      }

      if (!audio) return;
      if (isPlaying) {
        audio.pause();
        set({ isPlaying: false });
      } else {
        audio.play().then(() => set({ isPlaying: true })).catch(console.error);
      }
    },

    stop: () => {
      const { audio, isRoomMode } = get();
      if (isRoomMode) {
        const socket = useGameStore.getState().socket;
        if (socket) {
          socket.emit('music-room:action', {
            action: 'stop',
            progress: 0,
            song: null
          });
        }
        return;
      }

      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        set({ currentSong: null, isPlaying: false, progress: 0 });
      }
    },

    setVolume: (val) => {
      const { audio } = get();
      const vol = Math.max(0, Math.min(1, val));
      set({ volume: vol, isMuted: vol === 0 });
      if (audio) {
        audio.volume = vol;
        audio.muted = vol === 0;
      }
    },

    toggleMute: () => {
      const { audio, isMuted, volume } = get();
      const targetMute = !isMuted;
      set({ isMuted: targetMute });
      if (audio) {
        audio.muted = targetMute;
        audio.volume = targetMute ? 0 : volume;
      }
    },

    seek: (seconds) => {
      const { audio, isRoomMode, currentSong } = get();
      if (!currentSong) return;

      if (isRoomMode) {
        const socket = useGameStore.getState().socket;
        if (socket) {
          socket.emit('music-room:action', {
            action: 'seek',
            progress: seconds,
            song: currentSong
          });
        }
        return;
      }

      if (audio) {
        audio.currentTime = seconds;
        set({ progress: seconds });
      }
    },

    skipForward10: () => {
      const { audio, progress } = get();
      if (audio) {
        const target = Math.min(audio.currentTime + 10, audio.duration || 30);
        get().seek(target);
      }
    },

    skipBackward10: () => {
      const { audio, progress } = get();
      if (audio) {
        const target = Math.max(audio.currentTime - 10, 0);
        get().seek(target);
      }
    },

    addToQueue: (song) => {
      const { isRoomMode, localQueue } = get();
      if (isRoomMode) {
        const socket = useGameStore.getState().socket;
        if (socket) {
          socket.emit('music-room:queue-update', {
            actionType: 'add',
            data: { song }
          });
        }
        return;
      }

      if (!localQueue.some((q) => q.id === song.id)) {
        set({ localQueue: [...localQueue, song] });
        get().addToast(`"${song.title}" added to queue`, 'success');
      }
    },

    removeFromQueue: (songId) => {
      const { isRoomMode, localQueue } = get();
      if (isRoomMode) {
        const socket = useGameStore.getState().socket;
        if (socket) {
          socket.emit('music-room:queue-update', {
            actionType: 'remove',
            data: { songId }
          });
        }
        return;
      }

      set({ localQueue: localQueue.filter((q) => q.id !== songId) });
      get().addToast('Removed song from queue', 'info');
    },

    reorderQueue: (newQueue) => {
      const { isRoomMode } = get();
      if (isRoomMode) {
        const socket = useGameStore.getState().socket;
        if (socket) {
          socket.emit('music-room:queue-update', {
            actionType: 'reorder',
            data: { queue: newQueue }
          });
        }
        return;
      }

      set({ localQueue: newQueue });
    },

    nextSong: () => {
      const { isRoomMode, localQueue, room, currentSong, isShuffle, playSong, trendingSongs } = get();
      if (isRoomMode && room) {
        const socket = useGameStore.getState().socket;
        if (socket) {
          const queue = room.queue || [];
          if (queue.length > 0) {
            socket.emit('music-room:action', {
              action: 'skip',
              progress: 0,
              song: null
            });
          } else if (trendingSongs.length > 0) {
            const choices = currentSong
              ? trendingSongs.filter((s) => s.id !== currentSong.id)
              : trendingSongs;
            const randomSong = choices[Math.floor(Math.random() * choices.length)] || trendingSongs[0];
            socket.emit('music-room:action', {
              action: 'play',
              progress: 0,
              song: randomSong
            });
          }
        }
        return;
      }

      // Solo mode autoplay logic
      if (localQueue.length > 0) {
        let nextIndex = -1;
        if (currentSong) {
          const idx = localQueue.findIndex((q) => q.id === currentSong.id);
          if (idx !== -1) {
            if (isShuffle) {
              nextIndex = Math.floor(Math.random() * localQueue.length);
            } else if (idx < localQueue.length - 1) {
              nextIndex = idx + 1; // Play next in queue
            }
          } else {
            nextIndex = 0; // Current song wasn't in queue, start queue
          }
        } else {
          nextIndex = 0; // No song playing, start queue
        }

        if (nextIndex !== -1) {
          const next = localQueue[nextIndex];
          if (next) {
            playSong(next);
            return;
          }
        }
      }

      // Autoplay / Queue finished: play a random song from trendingSongs
      if (trendingSongs.length > 0) {
        const choices = currentSong
          ? trendingSongs.filter((s) => s.id !== currentSong.id)
          : trendingSongs;
        const randomSong = choices[Math.floor(Math.random() * choices.length)] || trendingSongs[0];
        if (randomSong) {
          get().addToast(`Autoplaying: "${randomSong.title}"`, 'info');
          playSong(randomSong);
        }
      }
    },

    prevSong: () => {
      const { isRoomMode, localQueue, currentSong, playSong } = get();
      if (isRoomMode) return; // Prev is disabled/not applicable in room mode

      if (localQueue.length === 0) return;

      let prevIndex = 0;
      if (currentSong) {
        const idx = localQueue.findIndex((q) => q.id === currentSong.id);
        if (idx !== -1) {
          prevIndex = idx - 1;
          if (prevIndex < 0) prevIndex = localQueue.length - 1;
        }
      }

      const prev = localQueue[prevIndex];
      if (prev) playSong(prev);
    },

    toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
    toggleRepeat: () => set((state) => ({ isRepeat: !state.isRepeat })),

    playPlaylist: (songs) => {
      if (songs.length === 0) return;
      const { isRoomMode, playSong, reorderQueue } = get();
      if (isRoomMode) {
        reorderQueue(songs);
        setTimeout(() => {
          playSong(songs[0]);
        }, 150);
      } else {
        set({ localQueue: songs });
        playSong(songs[0]);
      }
    },

    // --- Room Sockets Management ---
    createRoom: (roomName, maxParticipants, isPrivate) => {
      const socket = useGameStore.getState().socket;
      if (socket) {
        set({ isCreatingRoom: true });
        socket.emit('music-room:create', { roomName, maxParticipants, isPrivate });
      }
    },

    joinRoom: (roomCode) => {
      const socket = useGameStore.getState().socket;
      if (socket) {
        socket.emit('music-room:join', { roomCode });
      }
    },

    leaveRoom: () => {
      const socket = useGameStore.getState().socket;
      if (socket) {
        socket.emit('music-room:leave');
      }
      // Stop and clear local playback when leaving a room
      get().stop();
      set({ room: null, isRoomMode: false });
    },

    sendChatMessage: (message) => {
      const socket = useGameStore.getState().socket;
      if (socket && message.trim() !== '') {
        socket.emit('music-room:chat-message', { message: message.trim() });
      }
    },

    transferHost: (targetPlayerId) => {
      const socket = useGameStore.getState().socket;
      if (socket) {
        socket.emit('music-room:transfer-host', { targetPlayerId });
      }
    },

    toggleControl: (allow) => {
      const socket = useGameStore.getState().socket;
      if (socket) {
        socket.emit('music-room:toggle-control', { allow });
      }
    },

    voteSong: (songId, voteType) => {
      const socket = useGameStore.getState().socket;
      if (socket) {
        socket.emit('music-room:queue-update', {
          actionType: 'vote',
          data: { songId, voteType }
        });
      }
    },

    // --- Socket Listeners Binder ---
    setupSocketListeners: () => {
      const socket = useGameStore.getState().socket;
      if (!socket) return;

      socket.on('music-room:created', (room: MusicRoom) => {
        set({ room, isRoomMode: true, isCreatingRoom: false });
        get().addToast(`Room "${room.name}" created! Code: ${room.id}`, 'success');
      });

      socket.on('music-room:updated', (updatedRoom: MusicRoom) => {
        const { room: currentRoom, audio, currentSong, isPlaying } = get();
        get().initAudio();

        const activeAudio = audio || get().audio;

        // Find the operator who modified state or just check updates
        set({ room: updatedRoom, isRoomMode: true });

        // Update Local Audio Playback to match room synchronization
        const serverState = updatedRoom.playbackState;
        
        if (serverState.currentSong) {
          const songUrlChanged = !currentSong || currentSong.id !== serverState.currentSong.id;
          
          if (songUrlChanged) {
            // Track changed, play the new song
            set({ currentSong: serverState.currentSong, duration: serverState.currentSong.duration / 1000 });
            if (activeAudio) {
              activeAudio.src = serverState.currentSong.previewUrl;
              if (serverState.status === 'playing') {
                activeAudio.currentTime = serverState.progress;
                activeAudio.play().then(() => set({ isPlaying: true })).catch(console.error);
              } else {
                activeAudio.currentTime = serverState.progress;
                activeAudio.pause();
                set({ isPlaying: false });
              }
            }
          } else {
            // Check status (play / pause status)
            if (serverState.status === 'playing') {
              if (!isPlaying && activeAudio) {
                activeAudio.currentTime = serverState.progress;
                activeAudio.play().then(() => set({ isPlaying: true })).catch(console.error);
              } else if (activeAudio) {
                // If drifting by more than 2 seconds, force seek to sync
                const drift = Math.abs(activeAudio.currentTime - serverState.progress);
                if (drift > 2) {
                  activeAudio.currentTime = serverState.progress;
                  set({ progress: serverState.progress });
                }
              }
            } else if (serverState.status === 'paused') {
              if (isPlaying && activeAudio) {
                activeAudio.pause();
                set({ isPlaying: false });
              }
              if (activeAudio) {
                activeAudio.currentTime = serverState.progress;
              }
            }
          }
        } else {
          // No song playing, stop local playback
          if (activeAudio) {
            activeAudio.pause();
            activeAudio.src = '';
          }
          set({ currentSong: null, isPlaying: false, progress: 0 });
        }
      });
    },

    cleanupSocketListeners: () => {
      const socket = useGameStore.getState().socket;
      if (!socket) return;
      socket.off('music-room:created');
      socket.off('music-room:updated');
    }
  };
});
