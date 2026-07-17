export interface MusicRoomPlayer {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  socketId: string;
  onlineStatus: 'online' | 'offline';
  currentlyListening: string | null;
}

export interface MusicSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in milliseconds
  previewUrl: string;
  addedBy?: string; // username
  votes?: Record<string, 'up' | 'down'>; // userId -> vote
  voteCount?: number; // upvotes - downvotes
}

export interface MusicRoomPlaybackState {
  status: 'playing' | 'paused' | 'stopped';
  currentSong: MusicSong | null;
  progress: number; // in seconds
  lastUpdated: number; // Date.now()
}

export interface MusicChatMessage {
  id: string;
  sender: {
    id: string;
    username: string;
    avatar: string;
  } | null; // null represents system message
  message: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface MusicRoom {
  id: string; // 5-letter code
  name: string;
  hostId: string;
  maxParticipants: number;
  isPrivate: boolean;
  players: MusicRoomPlayer[];
  queue: MusicSong[];
  playbackState: MusicRoomPlaybackState;
  allowEveryoneControl: boolean;
  chatMessages: MusicChatMessage[];
}

class MusicRoomManager {
  private rooms: Map<string, MusicRoom> = new Map();
  private socketToRoom: Map<string, string> = new Map(); // socketId -> roomCode

  generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(
    hostId: string,
    username: string,
    avatar: string,
    rating: number,
    socketId: string,
    roomName: string,
    maxParticipants: number = 5,
    isPrivate: boolean = false
  ): MusicRoom {
    // If the socket was in another room, make them leave first
    this.leaveRoom(socketId);

    const roomCode = this.generateRoomCode();
    const roomNameClean = roomName && roomName.trim() !== '' ? roomName.trim() : `${username}'s Room`;
    
    const room: MusicRoom = {
      id: roomCode,
      name: roomNameClean,
      hostId,
      maxParticipants,
      isPrivate,
      players: [
        {
          id: hostId,
          username,
          avatar,
          rating,
          socketId,
          onlineStatus: 'online',
          currentlyListening: null
        }
      ],
      queue: [],
      playbackState: {
        status: 'stopped',
        currentSong: null,
        progress: 0,
        lastUpdated: Date.now()
      },
      allowEveryoneControl: false,
      chatMessages: [
        {
          id: `${Date.now()}_init`,
          sender: null,
          message: `${username} created the room "${roomNameClean}"`,
          timestamp: new Date().toISOString(),
          isSystem: true
        }
      ]
    };

    this.rooms.set(roomCode, room);
    this.socketToRoom.set(socketId, roomCode);
    return room;
  }

  joinRoom(
    roomCode: string,
    playerId: string,
    username: string,
    avatar: string,
    rating: number,
    socketId: string
  ): MusicRoom {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) {
      throw new Error('Room not found');
    }

    // Check if player is already inside the room
    const existingPlayerIndex = room.players.findIndex((p) => p.id === playerId);
    if (existingPlayerIndex !== -1) {
      room.players[existingPlayerIndex].socketId = socketId;
      room.players[existingPlayerIndex].onlineStatus = 'online';
      this.socketToRoom.set(socketId, code);
      return room;
    }

    // Enforce participant limits
    if (room.players.length >= room.maxParticipants) {
      throw new Error(`Room is full (Max limit: ${room.maxParticipants} players)`);
    }

    const newPlayer: MusicRoomPlayer = {
      id: playerId,
      username,
      avatar,
      rating,
      socketId,
      onlineStatus: 'online',
      currentlyListening: room.playbackState.currentSong ? room.playbackState.currentSong.title : null
    };

    room.players.push(newPlayer);
    this.socketToRoom.set(socketId, code);

    // Add system message
    room.chatMessages.push({
      id: `${Date.now()}_join`,
      sender: null,
      message: `${username} joined the room`,
      timestamp: new Date().toISOString(),
      isSystem: true
    });

    return room;
  }

  getRoom(roomCode: string): MusicRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  getRoomBySocket(socketId: string): MusicRoom | undefined {
    const code = this.socketToRoom.get(socketId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  leaveRoom(socketId: string): { roomCode: string; room?: MusicRoom; wasDeleted: boolean } | null {
    const code = this.socketToRoom.get(socketId);
    if (!code) return null;

    const room = this.rooms.get(code);
    this.socketToRoom.delete(socketId);

    if (!room) return null;

    const playerIndex = room.players.findIndex((p) => p.socketId === socketId);
    if (playerIndex === -1) return null;

    const leavingPlayer = room.players[playerIndex];
    room.players.splice(playerIndex, 1);

    // If room is empty, delete it
    if (room.players.length === 0) {
      this.rooms.delete(code);
      return { roomCode: code, wasDeleted: true };
    }

    // Add system message
    room.chatMessages.push({
      id: `${Date.now()}_leave`,
      sender: null,
      message: `${leavingPlayer.username} left the room`,
      timestamp: new Date().toISOString(),
      isSystem: true
    });

    // If host left, transfer host to next player
    if (room.hostId === leavingPlayer.id) {
      const nextHost = room.players[0];
      room.hostId = nextHost.id;
      
      room.chatMessages.push({
        id: `${Date.now()}_host`,
        sender: null,
        message: `${nextHost.username} has been promoted to host`,
        timestamp: new Date().toISOString(),
        isSystem: true
      });
    }

    return { roomCode: code, room, wasDeleted: false };
  }

  // Handle Playback State changes (Play, Pause, Seek, Stop, Next, Prev)
  syncPlayback(
    socketId: string,
    action: 'play' | 'pause' | 'seek' | 'skip' | 'stop',
    progress: number,
    song: MusicSong | null,
    operatorName: string
  ): MusicRoom {
    const room = this.getRoomBySocket(socketId);
    if (!room) throw new Error('Room not found');

    const player = room.players.find(p => p.socketId === socketId);
    const isHost = player && player.id === room.hostId;

    if (!isHost && !room.allowEveryoneControl) {
      throw new Error('Only the host can modify playback settings');
    }

    if (action === 'play') {
      room.playbackState.status = 'playing';
      if (song) room.playbackState.currentSong = song;
      room.playbackState.progress = progress;
      room.playbackState.lastUpdated = Date.now();
    } else if (action === 'pause') {
      room.playbackState.status = 'paused';
      room.playbackState.progress = progress;
      room.playbackState.lastUpdated = Date.now();
    } else if (action === 'seek') {
      room.playbackState.progress = progress;
      room.playbackState.lastUpdated = Date.now();
    } else if (action === 'stop') {
      room.playbackState.status = 'stopped';
      room.playbackState.currentSong = null;
      room.playbackState.progress = 0;
      room.playbackState.lastUpdated = Date.now();
    } else if (action === 'skip') {
      const currentQueue = room.queue;
      if (currentQueue.length > 0) {
        let nextIndex = 0;
        if (room.playbackState.currentSong) {
          const currentId = room.playbackState.currentSong.id;
          const idx = currentQueue.findIndex(s => s.id === currentId);
          if (idx !== -1 && idx < currentQueue.length - 1) {
            nextIndex = idx + 1;
          }
        }
        const nextSong = currentQueue[nextIndex];
        room.playbackState.status = 'playing';
        room.playbackState.currentSong = nextSong;
        room.playbackState.progress = 0;
        room.playbackState.lastUpdated = Date.now();
        song = nextSong;
      } else {
        room.playbackState.status = 'stopped';
        room.playbackState.currentSong = null;
        room.playbackState.progress = 0;
        room.playbackState.lastUpdated = Date.now();
        song = null;
      }
    }

    // System message about the action
    let messageText = '';
    if (action === 'play' && song) {
      messageText = `${operatorName} played "${song.title}"`;
    } else if (action === 'pause') {
      messageText = `${operatorName} paused the music`;
    } else if (action === 'seek') {
      messageText = `${operatorName} seeked the song`;
    } else if (action === 'skip') {
      messageText = song ? `${operatorName} skipped to "${song.title}"` : `${operatorName} skipped (end of queue)`;
    }

    if (messageText) {
      room.chatMessages.push({
        id: `${Date.now()}_play_action`,
        sender: null,
        message: messageText,
        timestamp: new Date().toISOString(),
        isSystem: true
      });
    }

    // Update currently listening status for all players
    const currentTitle = room.playbackState.currentSong ? room.playbackState.currentSong.title : null;
    room.players.forEach(p => {
      p.currentlyListening = currentTitle;
    });

    return room;
  }

  // Handle shared queue operations
  updateQueue(socketId: string, actionType: 'add' | 'remove' | 'reorder' | 'vote', data: any, operatorName: string): MusicRoom {
    const room = this.getRoomBySocket(socketId);
    if (!room) throw new Error('Room not found');

    const player = room.players.find(p => p.socketId === socketId);
    if (!player) throw new Error('Player not in room');

    if (actionType === 'add') {
      const song: MusicSong = {
        ...data.song,
        addedBy: operatorName,
        votes: {},
        voteCount: 0
      };
      
      // Check if song already exists in queue to prevent duplicate previews
      if (!room.queue.some(s => s.id === song.id)) {
        room.queue.push(song);
        room.chatMessages.push({
          id: `${Date.now()}_add_song`,
          sender: null,
          message: `${operatorName} added "${song.title}" to the queue`,
          timestamp: new Date().toISOString(),
          isSystem: true
        });
      }
    } else if (actionType === 'remove') {
      const songId = data.songId;
      const songIndex = room.queue.findIndex(s => s.id === songId);
      if (songIndex !== -1) {
        const removedSong = room.queue[songIndex];
        room.queue.splice(songIndex, 1);
        room.chatMessages.push({
          id: `${Date.now()}_remove_song`,
          sender: null,
          message: `${operatorName} removed "${removedSong.title}" from the queue`,
          timestamp: new Date().toISOString(),
          isSystem: true
        });
      }
    } else if (actionType === 'reorder') {
      if (Array.isArray(data.queue)) {
        room.queue = data.queue;
      }
    } else if (actionType === 'vote') {
      const { songId, voteType } = data; // voteType: 'up', 'down', or null
      const song = room.queue.find(s => s.id === songId);
      if (song) {
        if (!song.votes) song.votes = {};
        if (voteType === null || song.votes[player.id] === voteType) {
          delete song.votes[player.id];
        } else {
          song.votes[player.id] = voteType;
        }

        // Tally votes
        let count = 0;
        Object.values(song.votes).forEach(v => {
          if (v === 'up') count++;
          if (v === 'down') count--;
        });
        song.voteCount = count;

        // Auto-reorder queue based on votes (descending)
        // Keep the currently playing song at the top if it is part of the queue
        // Or sort all items in queue
        room.queue.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
      }
    }

    return room;
  }

  // Transfer host to another player
  transferHost(socketId: string, targetPlayerId: string, operatorName: string): MusicRoom {
    const room = this.getRoomBySocket(socketId);
    if (!room) throw new Error('Room not found');

    if (room.hostId !== room.players.find(p => p.socketId === socketId)?.id) {
      throw new Error('Only the host can transfer host ownership');
    }

    const targetPlayer = room.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) throw new Error('Target player not in room');

    room.hostId = targetPlayerId;
    room.chatMessages.push({
      id: `${Date.now()}_host_transfer`,
      sender: null,
      message: `${operatorName} transferred host role to ${targetPlayer.username}`,
      timestamp: new Date().toISOString(),
      isSystem: true
    });

    return room;
  }

  // Toggle everyone control setting
  toggleEveryoneControl(socketId: string, allow: boolean, operatorName: string): MusicRoom {
    const room = this.getRoomBySocket(socketId);
    if (!room) throw new Error('Room not found');

    if (room.hostId !== room.players.find(p => p.socketId === socketId)?.id) {
      throw new Error('Only the host can toggle playback control permission');
    }

    room.allowEveryoneControl = allow;
    room.chatMessages.push({
      id: `${Date.now()}_control_toggle`,
      sender: null,
      message: `${operatorName} allowed ${allow ? 'everyone' : 'only host'} to control playback`,
      timestamp: new Date().toISOString(),
      isSystem: true
    });

    return room;
  }

  // Add chat message
  addChatMessage(socketId: string, message: string, senderInfo: { id: string; username: string; avatar: string }): MusicRoom {
    const room = this.getRoomBySocket(socketId);
    if (!room) throw new Error('Room not found');

    room.chatMessages.push({
      id: `${Date.now()}_msg_${Math.random().toString(36).substring(2, 9)}`,
      sender: senderInfo,
      message,
      timestamp: new Date().toISOString()
    });

    // Limit chat messages to last 100 in memory
    if (room.chatMessages.length > 100) {
      room.chatMessages.shift();
    }

    return room;
  }
}

export const musicRoomManager = new MusicRoomManager();
