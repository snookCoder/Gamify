import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';

export interface RoomPlayer {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  socketId: string;
  isReady: boolean;
  symbol?: string; // 'X' or 'O'
}

export interface GameState {
  board: any;
  turn: string; // userId whose turn it is
  winner: string | null; // userId, 'draw', or null
  status: 'playing' | 'gameover';
  winningSequence?: number[];
}

export interface Room {
  id: string; // roomCode
  hostId: string;
  game: string;
  status: 'waiting' | 'playing' | 'gameover';
  isPrivate: boolean;
  players: RoomPlayer[];
  gameState: GameState | null;
  turnTimeLeft: number;
  rematchRequests?: string[];
}

export interface ChatMessage {
  id: string;
  sender: {
    id: string;
    username: string;
    avatar: string;
  };
  message: string;
  timestamp: string;
}

interface GameStoreState {
  socket: Socket | null;
  room: Room | null;
  publicRooms: Room[];
  chatMessages: ChatMessage[];
  typingPlayers: Record<string, string>; // userId -> username
  isConnected: boolean;
  error: string | null;
  onlineUsers: any[];
  activeInvite: {
    sender: {
      id: string;
      username: string;
      avatar: string;
      rating: number;
    };
    roomCode: string;
    game: string;
  } | null;

  connectSocket: (token: string, onRoomCreated?: (roomCode: string) => void, onRoomJoined?: (roomCode: string) => void) => void;
  disconnectSocket: () => void;
  createRoom: (game: string, isPrivate: boolean) => void;
  joinRoom: (roomCode: string) => void;
  leaveRoom: () => void;
  toggleReady: (isReady: boolean) => void;
  startGame: (settings?: any) => void;
  makeMove: (payload: any) => void;
  playAgain: () => void;
  sendChatMessage: (message: string) => void;
  sendTypingStatus: (isTyping: boolean) => void;
  sendInvite: (targetUserId: string, roomCode: string) => void;
  declineInvite: () => void;
  acceptInvite: (onAccepted?: (roomCode: string) => void) => void;
  clearError: () => void;
  refreshLobby: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const useGameStore = create<GameStoreState>((set, get) => ({
  socket: null,
  room: null,
  publicRooms: [],
  chatMessages: [],
  typingPlayers: {},
  isConnected: false,
  error: null,
  onlineUsers: [],
  activeInvite: null,

  connectSocket: (token, onRoomCreated, onRoomJoined) => {
    if (get().socket) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      set({ isConnected: true, socket });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false, room: null });
    });

    socket.on('public-rooms', (rooms: Room[]) => {
      set({ publicRooms: rooms });
    });

    socket.on('online-users', (users: any[]) => {
      set({ onlineUsers: users });
    });

    socket.on('game-invite', (invite: any) => {
      set({ activeInvite: invite });
    });

    socket.on('profile-updated', (updatedUser: any) => {
      const mappedUser = {
        ...updatedUser,
        id: updatedUser._id || updatedUser.id,
      };
      useAuthStore.getState().updateUser(mappedUser);
    });

    socket.on('room-created', (room: Room) => {
      set({ room, chatMessages: [], typingPlayers: {} });
      if (onRoomCreated) onRoomCreated(room.id);
    });

    socket.on('room-updated', (room: Room) => {
      set({ room });
    });

    socket.on('game-started', (room: Room) => {
      set({ room, chatMessages: [] });
    });

    socket.on('timer-tick', ({ timeLeft }: { timeLeft: number }) => {
      set((state) => {
        if (!state.room) return {};
        return { room: { ...state.room, turnTimeLeft: timeLeft } };
      });
    });

    socket.on('game-over', ({ winner, reason }: { winner: string | null; reason: string }) => {
      console.log('Game over:', winner, reason);
    });

    socket.on('chat-message', (msg: ChatMessage) => {
      set((state) => ({ chatMessages: [...state.chatMessages, msg] }));
    });

    socket.on('player-typing', ({ userId, username, isTyping }: { userId: string; username: string; isTyping: boolean }) => {
      set((state) => {
        const nextTyping = { ...state.typingPlayers };
        if (isTyping) {
          nextTyping[userId] = username;
        } else {
          delete nextTyping[userId];
        }
        return { typingPlayers: nextTyping };
      });
    });

    socket.on('error', (errMsg: string) => {
      set({ error: errMsg });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, room: null, isConnected: false });
    }
  },

  createRoom: (game, isPrivate) => {
    const coins = useAuthStore.getState().user?.coins ?? 0;
    if (coins < 50) {
      set({ error: 'Insufficient Coins! You need at least 50 coins to play. 🪙' });
      return;
    }
    const { socket } = get();
    if (socket) {
      socket.emit('create-room', { game, isPrivate });
    }
  },

  joinRoom: (roomCode) => {
    const coins = useAuthStore.getState().user?.coins ?? 0;
    if (coins < 50) {
      set({ error: 'Insufficient Coins! You need at least 50 coins to play. 🪙' });
      return;
    }
    const { socket } = get();
    if (socket) {
      socket.emit('join-room', { roomCode });
    }
  },

  leaveRoom: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('leave-room');
      set({ room: null, chatMessages: [], typingPlayers: {} });
    }
  },

  toggleReady: (isReady) => {
    const { socket } = get();
    if (socket) {
      socket.emit('ready-status', { isReady });
    }
  },

  startGame: (settings?: any) => {
    const { socket } = get();
    if (socket) {
      socket.emit('start-game', settings);
    }
  },

  makeMove: (payload) => {
    const { socket } = get();
    if (socket) {
      socket.emit('make-move', { move: payload });
    }
  },

  playAgain: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('play-again');
    }
  },

  sendChatMessage: (message) => {
    const { socket } = get();
    if (socket) {
      socket.emit('chat-message', { message });
    }
  },

  sendTypingStatus: (isTyping) => {
    const { socket } = get();
    if (socket) {
      socket.emit('typing', { isTyping });
    }
  },

  sendInvite: (targetUserId, roomCode) => {
    const { socket } = get();
    if (socket) {
      socket.emit('send-invite', { targetUserId, roomCode });
    }
  },

  declineInvite: () => {
    set({ activeInvite: null });
  },

  acceptInvite: (onAccepted) => {
    const { activeInvite, joinRoom } = get();
    if (activeInvite) {
      const coins = useAuthStore.getState().user?.coins ?? 0;
      if (coins < 50) {
        set({ error: 'Insufficient Coins! You need at least 50 coins to play. 🪙', activeInvite: null });
        return;
      }
      joinRoom(activeInvite.roomCode);
      if (onAccepted) {
        onAccepted(activeInvite.roomCode);
      }
      set({ activeInvite: null });
    }
  },

  clearError: () => set({ error: null }),
  refreshLobby: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('refresh-lobby');
    }
  },
}));
