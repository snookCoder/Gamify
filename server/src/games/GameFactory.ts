import { IGameEngine } from './GameEngine';
import { TicTacToeEngine } from './TicTacToeEngine';
import { GuessTheSongEngine } from './GuessTheSongEngine';

const gameEngines: Record<string, IGameEngine> = {
  'tic-tac-toe': new TicTacToeEngine(),
  'guess-the-song': new GuessTheSongEngine(),
};

export const getGameEngine = (gameType: string): IGameEngine => {
  const cleanGameType = gameType.trim().toLowerCase();
  console.log(`[GameFactory] getGameEngine lookup: "${cleanGameType}" (raw: ${JSON.stringify(gameType)})`);
  console.log(`[GameFactory] Available engines:`, Object.keys(gameEngines));
  const engine = gameEngines[cleanGameType];
  if (!engine) {
    throw new Error(`Game engine for ${gameType} not found.`);
  }
  return engine;
};
