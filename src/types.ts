// Types for Wordle game

export type LetterState = 'correct' | 'present' | 'absent' | 'empty';

export interface Letter {
  value: string;
  state: LetterState;
}

export interface GameState {
  targetWord: string;
  currentGuess: string;
  guesses: string[];
  gameStatus: 'playing' | 'won' | 'lost';
  currentRow: number;
}

export interface UserStats {
  totalGames: number;
  wins: number;
  losses: number;
  winPercentage: number;
  currentStreak: number;
  maxStreak: number;
}

export interface StoredGameState {
  gameState: GameState;
  stats: UserStats;
  lastPlayedDate: string;
}

export interface UserInfo {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  walletAddress?: string;
}

export interface LastSubmitted {
  games: number;
  wins: number;
  losses: number;
  nonce: number;
  txHash?: string;
  timestamp?: number;
}
