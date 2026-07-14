export interface GameMove {
  playerId: string;
  payload: any; // Game-specific details, e.g. cell index for Tic-Tac-Toe
}

export interface GameState {
  board: any;             // board representation (e.g. string[] for Tic-Tac-Toe)
  turn: string;           // player ID
  winner: string | null;   // player ID, 'draw', or null
  status: 'playing' | 'gameover';
  winningSequence?: any;  // game-specific data, e.g. indices of winning cells
}

export interface IGameEngine {
  initializeGame(players: string[]): GameState;
  validateMove(state: GameState, move: GameMove, playerSymbol: string): boolean;
  applyMove(state: GameState, move: GameMove, playerSymbol: string, players: string[]): GameState;
}
