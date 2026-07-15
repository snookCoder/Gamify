import { GameMove, GameState, IGameEngine } from './GameEngine';

export interface SongChallengeGuess {
  songId: string;
  isCorrect: boolean;
  timeTaken: number; // in ms
}

export interface GuessTheSongBoard {
  songsB: {
    id: string; // trackId
    title: string; // trackName
    artist: string; // artistName
    album?: string; // collectionName
    previewUrl: string; // 30s preview URL
    artworkUrl: string; // scaled cover art
    options: string[]; // 4 multiple choice options
  }[]; // Host's songs for Guest (Player B) to guess
  
  songsA: {
    id: string;
    title: string;
    artist: string;
    album?: string;
    previewUrl: string;
    artworkUrl: string;
    options: string[];
  }[]; // Guest's songs for Host (Player A) to guess
  
  phase: 'guessing_b' | 'lobby_a' | 'guessing_a' | 'finished';
  status: 'playing' | 'reveal' | 'finished'; // round active or reveal window
  currentSongIndex: number; // 0 to 4
  difficultyDuration: number; // 8 seconds per round
  songStartTime: number; // Date.now() when round started
  previewStartOffset: number; // start offset inside 30s audio
  guessesB: Record<number, SongChallengeGuess>; // index -> guess log
  guessesA: Record<number, SongChallengeGuess>; // index -> guess log
  hostId: string;
  guestId: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export class GuessTheSongEngine implements IGameEngine {
  initializeGame(players: string[]): GameState {
    const board: GuessTheSongBoard = {
      songsB: [],
      songsA: [],
      phase: 'guessing_b',
      status: 'playing',
      currentSongIndex: 0,
      difficultyDuration: 20,
      songStartTime: 0,
      previewStartOffset: 0,
      guessesB: {},
      guessesA: {},
      hostId: players[0],
      guestId: players[1] || 'Guest',
      category: 'Pop',
      difficulty: 'medium'
    };

    return {
      board,
      turn: board.guestId, // Player B starts guessing first!
      winner: null,
      status: 'playing',
    };
  }

  validateMove(state: GameState, move: GameMove, playerSymbol: string): boolean {
    const board = state.board as GuessTheSongBoard;
    if (state.status !== 'playing') return false;

    const payload = move.payload;
    
    if (payload.action === 'submitChallengeSongs') {
      // Guest submits their 5 challenge songs for Host
      if (board.phase !== 'lobby_a') return false;
      if (move.playerId !== board.guestId) return false;
      if (!payload.songs || !Array.isArray(payload.songs) || payload.songs.length === 0) return false;
      return true;
    }

    if (payload.action === 'guess') {
      if (board.status !== 'playing') return false;
      
      if (board.phase === 'guessing_b') {
        // Guest (Player B) is currently guessing
        if (move.playerId !== board.guestId) return false;
        if (board.guessesB[board.currentSongIndex] !== undefined) return false;
      } else if (board.phase === 'guessing_a') {
        // Host (Player A) is currently guessing
        if (move.playerId !== board.hostId) return false;
        if (board.guessesA[board.currentSongIndex] !== undefined) return false;
      } else {
        return false;
      }
      return true;
    }

    return false;
  }

  applyMove(state: GameState, move: GameMove, playerSymbol: string, players: string[]): GameState {
    const nextState = { ...state };
    const board = { ...nextState.board } as GuessTheSongBoard;
    board.guessesB = { ...board.guessesB };
    board.guessesA = { ...board.guessesA };

    const payload = move.payload;

    if (payload.action === 'submitChallengeSongs') {
      // Save Guest's selected songs
      board.songsA = payload.songs.map((t: any) => ({
        id: String(t.id),
        title: t.title || 'Unknown Song',
        artist: t.artist || 'Unknown Artist',
        album: t.album || 'Single',
        previewUrl: t.previewUrl || '',
        artworkUrl: t.artworkUrl || '',
        options: t.options || []
      }));

      // Generate 4 multiple choice options per song for Guest's songs if not present
      const fallbackDistractors = [
        'Believer', 'Shape of You', 'Blinding Lights', 'Dynamite', 
        'Perfect', 'Bad Habits', 'Stay', 'Levitating', 'Starboy', 
        'As It Was', 'Flowers', 'Creepin', 'Save Your Tears'
      ];

      board.songsA.forEach((song) => {
        if (!song.options || song.options.length === 0) {
          const otherTitles = board.songsA
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
        }
      });

      // Transition to Phase 2: Host Guessing
      board.phase = 'guessing_a';
      board.status = 'playing';
      board.currentSongIndex = 0;
      board.songStartTime = Date.now();
      board.previewStartOffset = Math.floor(Math.random() * 10);
      
      nextState.turn = board.hostId;
      nextState.board = board;
      return nextState;
    }

    if (payload.action === 'guess') {
      const guessString = payload.guess || '';
      
      if (board.phase === 'guessing_b') {
        const currentSong = board.songsB[board.currentSongIndex];
        if (!currentSong) return nextState;

        const isCorrect = this.checkFuzzyMatch(guessString, currentSong.title);
        const timeTaken = Date.now() - board.songStartTime;

        board.guessesB[board.currentSongIndex] = {
          songId: currentSong.id,
          isCorrect,
          timeTaken
        };

        // Transition to reveal mode immediately
        board.status = 'reveal';
      } else if (board.phase === 'guessing_a') {
        const currentSong = board.songsA[board.currentSongIndex];
        if (!currentSong) return nextState;

        const isCorrect = this.checkFuzzyMatch(guessString, currentSong.title);
        const timeTaken = Date.now() - board.songStartTime;

        board.guessesA[board.currentSongIndex] = {
          songId: currentSong.id,
          isCorrect,
          timeTaken
        };

        board.status = 'reveal';
      }
    }

    nextState.board = board;
    return nextState;
  }

  private checkFuzzyMatch(userInput: string, targetAnswer: string): boolean {
    const clean = (s: string) => {
      let cleaned = s.toLowerCase().replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
      cleaned = cleaned.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
      return cleaned;
    };

    const u = clean(userInput);
    const t = clean(targetAnswer);

    if (u === t) return true;
    if (!u || !t) return false;

    const track = Array(t.length + 1).fill(null).map(() => Array(u.length + 1).fill(null));
    for (let i = 0; i <= t.length; i++) track[i][0] = i;
    for (let j = 0; j <= u.length; j++) track[0][j] = j;

    for (let i = 1; i <= t.length; i++) {
      for (let j = 1; j <= u.length; j++) {
        const indicator = t[i - 1] === u[j - 1] ? 0 : 1;
        track[i][j] = Math.min(
          track[i - 1][j] + 1,
          track[i][j - 1] + 1,
          track[i - 1][j - 1] + indicator
        );
      }
    }

    const distance = track[t.length][u.length];
    const maxLength = Math.max(t.length, u.length);
    const similarity = 1 - distance / maxLength;
    return similarity >= 0.85;
  }
}
