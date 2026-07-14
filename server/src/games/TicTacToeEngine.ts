import { GameMove, GameState, IGameEngine } from './GameEngine';

export class TicTacToeEngine implements IGameEngine {
  initializeGame(players: string[]): GameState {
    const startingPlayer = players[Math.floor(Math.random() * players.length)];
    return {
      board: Array(9).fill(null),
      turn: startingPlayer,
      winner: null,
      status: 'playing',
    };
  }

  validateMove(state: GameState, move: GameMove, playerSymbol: string): boolean {
    if (state.status !== 'playing') return false;
    if (state.turn !== move.playerId) return false;

    const cellIndex = Number(move.payload);
    if (isNaN(cellIndex) || cellIndex < 0 || cellIndex > 8) return false;

    // Check if cell is empty
    if (state.board[cellIndex] !== null) return false;

    return true;
  }

  applyMove(state: GameState, move: GameMove, playerSymbol: string, players: string[]): GameState {
    const nextState = { ...state, board: [...state.board] };
    const cellIndex = Number(move.payload);
    
    // Set cell to symbol
    nextState.board[cellIndex] = playerSymbol;

    // Check for win
    const winResult = this.checkWin(nextState.board);
    if (winResult) {
      nextState.winner = move.playerId;
      nextState.status = 'gameover';
      nextState.winningSequence = winResult.line;
    } else if (nextState.board.every((cell: any) => cell !== null)) {
      // Check for draw
      nextState.winner = 'draw';
      nextState.status = 'gameover';
    } else {
      // Toggle turn
      const currentIdx = players.indexOf(state.turn);
      const nextIdx = (currentIdx + 1) % players.length;
      nextState.turn = players[nextIdx];
    }
    return nextState;
  }

  private checkWin(board: (string | null)[]): { symbol: string; line: number[] } | null {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { symbol: board[a]!, line };
      }
    }
    return null;
  }
}
