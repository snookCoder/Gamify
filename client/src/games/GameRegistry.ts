import TicTacToeBoard from './tic-tac-toe/Board';

export const GAME_REGISTRY: Record<string, React.ComponentType<any>> = {
  'tic-tac-toe': TicTacToeBoard,
};
