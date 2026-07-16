import { getGameEngine } from '../games/GameFactory';
import { GameState } from '../games/GameEngine';
import { User } from '../models/User';
import { Match } from '../models/Match';

export interface RoomPlayer {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  socketId: string;
  isReady: boolean;
  symbol?: string; // 'X' or 'O'
}

export interface Room {
  id: string; // 5-letter code
  hostId: string;
  game: string; // 'tic-tac-toe'
  status: 'waiting' | 'playing' | 'gameover';
  isPrivate: boolean;
  players: RoomPlayer[];
  gameState: GameState | null;
  turnTimeLeft: number; // 30s
  rematchRequests?: string[]; // track player IDs who requested rematch
}

class RoomManager {
  private rooms: Map<string, Room> = new Map();
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
    game: string = 'tic-tac-toe',
    isPrivate: boolean = false
  ): Room {
    this.leaveRoom(socketId);

    const roomCode = this.generateRoomCode();
    const room: Room = {
      id: roomCode,
      hostId,
      game,
      status: 'waiting',
      isPrivate,
      players: [
        {
          id: hostId,
          username,
          avatar,
          rating,
          socketId,
          isReady: true,
        },
      ],
      gameState: null,
      turnTimeLeft: 30,
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
  ): Room {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status !== 'waiting' && !room.players.some(p => p.id === playerId)) {
      throw new Error('Game in progress, cannot join');
    }

    const existingPlayerIndex = room.players.findIndex((p) => p.id === playerId);
    if (existingPlayerIndex !== -1) {
      room.players[existingPlayerIndex].socketId = socketId;
      this.socketToRoom.set(socketId, code);
      return room;
    }

    const maxPlayers = room.game === 'guess-the-song' ? 20 : 2;
    if (room.players.length >= maxPlayers) {
      throw new Error('Room is full');
    }

    room.players.push({
      id: playerId,
      username,
      avatar,
      rating,
      socketId,
      isReady: false,
    });

    this.socketToRoom.set(socketId, code);
    return room;
  }

  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  getRoomBySocket(socketId: string): Room | undefined {
    const code = this.socketToRoom.get(socketId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  getPublicRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(
      (room) => !room.isPrivate && room.status === 'waiting' && room.players.length < (room.game === 'guess-the-song' ? 20 : 2)
    );
  }

  toggleReady(socketId: string, isReady: boolean): Room {
    const room = this.getRoomBySocket(socketId);
    if (!room) throw new Error('Player not in a room');

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) throw new Error('Player not found in room');

    player.isReady = isReady;
    return room;
  }

  async startGame(socketId: string, settings?: any): Promise<Room> {
    const room = this.getRoomBySocket(socketId);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== room.players.find(p => p.socketId === socketId)?.id) {
      throw new Error('Only the host can start the game');
    }
    if (room.players.length < 2) {
      throw new Error('Need at least 2 players to start');
    }
    if (!room.players.every((p) => p.isReady)) {
      throw new Error('All players must be ready');
    }

    if (room.game === 'guess-the-song') {
      room.players.forEach((p) => {
        p.symbol = 'Player';
      });

      const cat = settings?.category || 'Pop';
      let selectedSongs: any[] = [];

      if (settings?.songs && Array.isArray(settings.songs) && settings.songs.length > 0) {
        selectedSongs = settings.songs.map((t: any) => ({
          id: String(t.id),
          title: t.title || 'Unknown Song',
          artist: t.artist || 'Unknown Artist',
          album: t.album || 'Single',
          previewUrl: t.previewUrl || '',
          artworkUrl: t.artworkUrl || ''
        }));
      } else {
        let searchTerm = 'English Pop';
        if (cat === 'Bollywood') searchTerm = 'Bollywood Hits';
        else if (cat === 'Hollywood') searchTerm = 'Hollywood Pop';
        else if (cat === 'Punjabi') searchTerm = 'Punjabi Pop';
        else if (cat === 'Anime') searchTerm = 'Anime theme';
        else if (cat === '90s') searchTerm = '90s Hits';
        else if (cat === 'Pop') searchTerm = 'English Pop';
        else if (cat === 'Rock') searchTerm = 'Rock classics';
        else if (cat === 'Hip Hop') searchTerm = 'Hip Hop';
        else if (cat === 'Custom') searchTerm = settings?.customSearch || 'Hits';

        let tracks: any[] = [];
        try {
          const countryParam = (cat === 'Bollywood' || cat === 'Punjabi') ? '&country=IN' : '';
          const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}${countryParam}&media=music&entity=song&limit=100`;
          const response = await fetch(url);
          const data = await response.json();
          tracks = data.results || [];
        } catch (err) {
          console.error('Error fetching from iTunes Search API:', err);
        }

        if (tracks.length === 0) {
          try {
            const countryParam = (cat === 'Bollywood' || cat === 'Punjabi') ? '&country=IN' : '';
            const fallbackTerm = (cat === 'Bollywood' || cat === 'Punjabi') ? 'bollywood' : 'pop';
            const response = await fetch(`https://itunes.apple.com/search?term=${fallbackTerm}${countryParam}&media=music&entity=song&limit=50`);
            const data = await response.json();
            tracks = data.results || [];
          } catch (err) {
            console.error('Fallback fetch error:', err);
          }
        }

        tracks = tracks.filter(t => t.previewUrl).sort(() => Math.random() - 0.5);
        const numRounds = Math.min(tracks.length, settings?.totalRounds || 10);
        
        if (numRounds === 0) {
          throw new Error('Could not fetch any songs for this category. Please try another one.');
        }

        selectedSongs = tracks.slice(0, numRounds).map((t: any) => ({
          id: String(t.trackId),
          title: t.trackName || 'Unknown Song',
          artist: t.artistName || 'Unknown Artist',
          album: t.collectionName || 'Single',
          previewUrl: t.previewUrl || '',
          artworkUrl: ''
        }));
      }

      // Generate 4 multiple choice options per song
      const fallbackDistractors = [
        'Believer', 'Shape of You', 'Blinding Lights', 'Dynamite', 
        'Perfect', 'Bad Habits', 'Stay', 'Levitating', 'Starboy', 
        'As It Was', 'Flowers', 'Creepin', 'Save Your Tears'
      ];

      selectedSongs.forEach((song) => {
        const otherTitles = selectedSongs
          .filter(s => s.id !== song.id)
          .map(s => s.title);
        
        const distractors: string[] = [];
        const pool = [...otherTitles].sort(() => Math.random() - 0.5);
        for (const title of pool) {
          if (distractors.length < 3 && !distractors.includes(title) && title !== song.title) {
            distractors.push(title);
          }
        }

        let fallbackIdx = 0;
        while (distractors.length < 3 && fallbackIdx < fallbackDistractors.length) {
          const item = fallbackDistractors[fallbackIdx];
          if (!distractors.includes(item) && item !== song.title) {
            distractors.push(item);
          }
          fallbackIdx++;
        }

        song.options = [song.title, ...distractors].sort(() => Math.random() - 0.5);
      });

      const hostId = room.hostId;
      const guest = room.players.find((p) => p.id !== hostId);
      const playerIds = [hostId, guest ? guest.id : 'Guest'];

      const engine = getGameEngine(room.game);
      room.gameState = engine.initializeGame(playerIds);
      room.status = 'playing';

      const board = room.gameState.board;
      board.songsB = selectedSongs;
      board.songsA = [];
      board.phase = 'guessing_b';
      board.status = 'playing';
      board.currentSongIndex = 0;
      board.difficulty = settings?.difficulty || 'medium';
      
      board.difficultyDuration = 20;
      board.songStartTime = Date.now();
      board.previewStartOffset = Math.floor(Math.random() * 10);
      board.category = cat;

      room.turnTimeLeft = 20;
    } else {
      room.players[0].symbol = 'X';
      if (room.players[1]) room.players[1].symbol = 'O';

      const playerIds = room.players.map((p) => p.id);
      const engine = getGameEngine(room.game);
      room.gameState = engine.initializeGame(playerIds);
      room.status = 'playing';
      room.turnTimeLeft = 30;
    }

    return room;
  }

  async handleGameOver(room: Room, winnerId: string | 'draw'): Promise<void> {
    room.status = 'gameover';
    if (room.gameState) {
      room.gameState.status = 'gameover';
      room.gameState.winner = winnerId;
    }

    const playerIds = room.players.map((p) => p.id);
    const isDraw = winnerId === 'draw';

    try {
      const match = new Match({
        roomId: room.id,
        game: room.game,
        players: playerIds,
        winner: isDraw ? null : winnerId,
        moves: room.gameState?.board || [],
        duration: 30 - room.turnTimeLeft,
      });
      await match.save();

      for (const player of room.players) {
        const user = await User.findById(player.id);
        if (!user) continue;

        if (isDraw) {
          user.draws += 1;
          user.rating += 3;
        } else if (player.id === winnerId) {
          user.wins += 1;
          user.rating += 10;
          user.coins += 50;
        } else {
          user.losses += 1;
          user.coins = Math.max(0, user.coins - 50);
        }

        const points = user.rating - 1000;
        user.level = Math.max(1, Math.floor(points / 50) + 1);

        await user.save();
        player.rating = user.rating;
      }
    } catch (err) {
      console.error('Error saving match stats:', err);
    }
  }

  async handleMove(socketId: string, payload: any): Promise<Room> {
    const room = this.getRoomBySocket(socketId);
    if (!room) throw new Error('Room not found');
    if (room.status !== 'playing' || !room.gameState) {
      throw new Error('Game not in progress');
    }

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) throw new Error('Player not in this room');

    const engine = getGameEngine(room.game);
    const move = {
      playerId: player.id,
      payload,
    };

    const playerSymbol = player.symbol || 'X';
    const playerIds = room.players.map((p) => p.id);

    const isValid = engine.validateMove(room.gameState, move, playerSymbol);
    if (!isValid) {
      throw new Error('Invalid move');
    }

    room.gameState = engine.applyMove(room.gameState, move, playerSymbol, playerIds);
    room.turnTimeLeft = 30;

    if (room.gameState.status === 'gameover') {
      await this.handleGameOver(room, room.gameState.winner!);
    }

    return room;
  }

  async handleTimeout(roomCode: string): Promise<Room | null> {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'playing' || !room.gameState) return null;

    if (room.game === 'ludo') {
      const board = room.gameState.board as any;
      board.hasRolled = false;
      board.diceRoll = null;
      board.consecutiveSixes = 0;
      
      const players = room.players.map((p) => p.id);
      const currentIdx = players.indexOf(room.gameState.turn);
      const nextIdx = (currentIdx + 1) % players.length;
      room.gameState.turn = players[nextIdx];
      room.turnTimeLeft = 30;
      return room;
    } else {
      const activePlayerId = room.gameState.turn;
      const opponent = room.players.find((p) => p.id !== activePlayerId);
      const winnerId = opponent ? opponent.id : 'draw';

      await this.handleGameOver(room, winnerId);
      return room;
    }
  }

  leaveRoom(socketId: string): { roomCode: string; room?: Room; wasDeleted: boolean } | null {
    const code = this.socketToRoom.get(socketId);
    if (!code) return null;

    const room = this.rooms.get(code);
    this.socketToRoom.delete(socketId);

    if (!room) return null;

    const playerIndex = room.players.findIndex((p) => p.socketId === socketId);
    if (playerIndex === -1) return null;

    const leavingPlayer = room.players[playerIndex];
    room.players.splice(playerIndex, 1);

    if (room.players.length === 0) {
      this.rooms.delete(code);
      return { roomCode: code, wasDeleted: true };
    }

    if (room.status === 'playing') {
      const remainingPlayer = room.players[0];
      this.handleGameOver(room, remainingPlayer.id);
    }

    if (room.hostId === leavingPlayer.id) {
      room.hostId = room.players[0].id;
      room.players[0].isReady = true;
    }

    return { roomCode: code, room, wasDeleted: false };
  }

  async restartGame(socketId: string): Promise<{ room: Room; startRematch: boolean }> {
    const room = this.getRoomBySocket(socketId);
    if (!room) throw new Error('Room not found');

    if (room.status !== 'gameover') {
      throw new Error('Game is still in progress');
    }

    if (!room.rematchRequests) {
      room.rematchRequests = [];
    }

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) throw new Error('Player not in room');

    if (!room.rematchRequests.includes(player.id)) {
      room.rematchRequests.push(player.id);
    }

    if (room.rematchRequests.length >= 2) {
      room.rematchRequests = [];
      room.status = 'playing';

      if (room.game === 'ludo') {
        const colors = ['red', 'yellow', 'green', 'blue'];
        room.players.forEach((p, idx) => {
          p.symbol = colors[idx] || 'red';
        });
      } else if (room.game === 'guess-the-song') {
        room.players.forEach((p) => {
          p.symbol = 'Player';
        });
      } else {
        room.players[0].symbol = 'X';
        if (room.players[1]) room.players[1].symbol = 'O';
      }

      if (room.game === 'guess-the-song') {
        // Rematch logic for Guess the Song: fetch fresh Bollywood tracks
        let oldCategory = 'Bollywood';
        let oldDifficulty = 'medium';
        if (room.gameState && room.gameState.board) {
          const oldBoard = room.gameState.board as any;
          oldCategory = oldBoard.category || 'Bollywood';
          oldDifficulty = oldBoard.difficulty || 'medium';
        }

        let searchTerm = 'Bollywood Hits';
        let tracks: any[] = [];
        try {
          const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&media=music&entity=song&limit=100`;
          const response = await fetch(url);
          const data = await response.json();
          tracks = data.results || [];
        } catch (err) {
          console.error('Error fetching rematch songs:', err);
        }

        if (tracks.length === 0) {
          try {
            const response = await fetch('https://itunes.apple.com/search?term=bollywood&media=music&entity=song&limit=50');
            const data = await response.json();
            tracks = data.results || [];
          } catch (err) {
            console.error('Rematch fallback fetch error:', err);
          }
        }

        tracks = tracks.filter(t => t.previewUrl).sort(() => Math.random() - 0.5);
        const selectedSongs = tracks.slice(0, 5).map((t: any) => ({
          id: String(t.trackId),
          title: t.trackName || 'Unknown Song',
          artist: t.artistName || 'Unknown Artist',
          album: t.collectionName || 'Single',
          previewUrl: t.previewUrl || '',
          artworkUrl: '',
          options: [] as string[]
        }));

        const fallbackDistractors = [
          'Tum Hi Ho', 'Kesariya', 'Channa Mereya', 'Apna Bana Le', 
          'Raataan Lambiyan', 'Dil Diyan Gallan', 'Zaalima', 'Gerua'
        ];

        selectedSongs.forEach((song) => {
          const otherTitles = selectedSongs
            .filter(s => s.id !== song.id)
            .map(s => s.title);
          
          const distractors: string[] = [];
          const pool = [...otherTitles].sort(() => Math.random() - 0.5);
          for (const title of pool) {
            if (distractors.length < 3 && !distractors.includes(title) && title !== song.title) {
              distractors.push(title);
            }
          }

          let fallbackIdx = 0;
          while (distractors.length < 3 && fallbackIdx < fallbackDistractors.length) {
            const item = fallbackDistractors[fallbackIdx];
            if (!distractors.includes(item) && item !== song.title) {
              distractors.push(item);
            }
            fallbackIdx++;
          }

          song.options = [song.title, ...distractors].sort(() => Math.random() - 0.5);
        });

        const playerIds = room.players.map((p) => p.id);
        const engine = getGameEngine(room.game);
        room.gameState = engine.initializeGame(playerIds);

        const board = room.gameState.board;
        board.songsB = selectedSongs;
        board.songsA = [];
        board.phase = 'guessing_b';
        board.status = 'playing';
        board.currentSongIndex = 0;
        board.difficulty = oldDifficulty;
        board.difficultyDuration = 20;
        board.songStartTime = Date.now();
        board.previewStartOffset = Math.floor(Math.random() * 10);
        board.category = oldCategory;

        room.turnTimeLeft = 20;
      } else {
        const playerIds = room.players.map((p) => p.id);
        const engine = getGameEngine(room.game);
        room.gameState = engine.initializeGame(playerIds);
        room.turnTimeLeft = 30;
      }

      return { room, startRematch: true };
    }

    return { room, startRematch: false };
  }
}

export const roomManager = new RoomManager();
