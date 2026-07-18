import { GameMove, GameState, IGameEngine } from './GameEngine';

export class BingoEngine implements IGameEngine {
  initializeGame(players: string[]): GameState {
    const startingPlayer = players[0] || '';
    
    // Create static 5x5 grid from 1 to 25
    const grid = Array.from({ length: 25 }, (_, i) => ({
      number: i + 1,
      marked: false
    }));

    // Initialize player scores to 0
    const scores: Record<string, number> = {};
    players.forEach(pId => {
      scores[pId] = 0;
    });

    return {
      board: {
        grid,
        scores,
        completedLines: []
      },
      turn: startingPlayer,
      winner: null,
      status: 'playing',
      winningSequence: []
    };
  }

  validateMove(state: GameState, move: GameMove, playerSymbol: string): boolean {
    if (state.status !== 'playing') return false;
    if (state.turn !== move.playerId) return false;

    const chosenNum = Number(move.payload);
    if (isNaN(chosenNum) || chosenNum < 1 || chosenNum > 25) return false;

    // Find the cell in the grid
    const grid = state.board?.grid || [];
    const cell = grid.find((c: any) => c.number === chosenNum);
    if (!cell || cell.marked) return false;

    return true;
  }

  applyMove(state: GameState, move: GameMove, playerSymbol: string, players: string[]): GameState {
    const nextState = {
      ...state,
      board: {
        grid: state.board.grid.map((c: any) => ({ ...c })),
        scores: { ...state.board.scores },
        completedLines: state.board.completedLines.map((line: number[]) => [...line])
      }
    };

    const chosenNum = Number(move.payload);
    
    // Mark the number on the board
    const cell = nextState.board.grid.find((c: any) => c.number === chosenNum);
    if (cell) {
      cell.marked = true;
    }

    // 12 possible winning lines (5 rows, 5 columns, 2 diagonals)
    const lines = [
      // Rows
      [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
      // Columns
      [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
      // Diagonals
      [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
    ];

    let newCompletions = 0;
    const grid = nextState.board.grid;

    for (const line of lines) {
      // Check if all cells in this line are marked
      const isComplete = line.every(idx => grid[idx].marked);
      
      if (isComplete) {
        // Check if this line is already marked as completed
        const alreadyDone = nextState.board.completedLines.some((doneLine: number[]) => 
          doneLine.length === line.length && doneLine.every((val, idx) => val === line[idx])
        );

        if (!alreadyDone) {
          nextState.board.completedLines.push(line);
          newCompletions++;
        }
      }
    }

    // Award points to active player
    if (newCompletions > 0) {
      nextState.board.scores[move.playerId] = (nextState.board.scores[move.playerId] || 0) + newCompletions;
    }

    // Check if current player reached 5 or more points
    const activeScore = nextState.board.scores[move.playerId] || 0;
    
    if (activeScore >= 5) {
      nextState.winner = move.playerId;
      nextState.status = 'gameover';
      nextState.winningSequence = nextState.board.completedLines;
    } else if (grid.every((c: any) => c.marked)) {
      // Draw or highest score wins if grid is full
      let highestScore = -1;
      let winnerId: string | 'draw' = 'draw';
      let duplicate = false;

      Object.entries(nextState.board.scores).forEach(([pId, score]: [string, any]) => {
        if (score > highestScore) {
          highestScore = score;
          winnerId = pId;
          duplicate = false;
        } else if (score === highestScore) {
          duplicate = true;
        }
      });

      nextState.winner = duplicate ? 'draw' : winnerId;
      nextState.status = 'gameover';
      nextState.winningSequence = nextState.board.completedLines;
    } else {
      // Rotate turn
      const currentIdx = players.indexOf(state.turn);
      const nextIdx = (currentIdx + 1) % players.length;
      nextState.turn = players[nextIdx];
    }

    return nextState;
  }
}
