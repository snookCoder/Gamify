import TicTacToeBoard from './tic-tac-toe/Board';
import GuessTheSongBoard from './guess-the-song/Board';

export const GAME_REGISTRY: Record<string, React.ComponentType<any>> = {
  'tic-tac-toe': TicTacToeBoard,
  'guess-the-song': GuessTheSongBoard,
};
