import { IGameEngine } from './GameEngine';
import { TicTacToeEngine } from './TicTacToeEngine';

const gameEngines: Record<string, IGameEngine> = {
  'tic-tac-toe': new TicTacToeEngine(),
};

export const getGameEngine = (gameType: string): IGameEngine => {
  const engine = gameEngines[gameType.toLowerCase()];
  if (!engine) {
    throw new Error(`Game engine for ${gameType} not found.`);
  }
  return engine;
};
