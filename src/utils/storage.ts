import { GameState, UserStats, LastSubmitted } from '../types';

const STORAGE_KEY = 'wordle-game-state';
const STATS_KEY = 'wordle-stats';
const LAST_PLAYED_KEY = 'wordle-last-played';
const LAST_SUBMITTED_KEY = 'wordle-last-submitted';

/**
 * Save game state to localStorage
 */
export const saveGameState = (gameState: GameState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  } catch (error) {
    console.error('Error saving game state:', error);
  }
};

/**
 * Load game state from localStorage
 */
export const loadGameState = (): GameState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as GameState;
  } catch (error) {
    console.error('Error loading game state:', error);
    return null;
  }
};

/**
 * Save user statistics
 */
export const saveStats = (stats: UserStats): void => {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving statistics:', error);
  }
};

/**
 * Load user statistics
 */
export const loadStats = (): UserStats => {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
      return JSON.parse(stored) as UserStats;
    }
  } catch (error) {
    console.error('Error loading statistics:', error);
  }

  // Return default statistics
  return {
    totalGames: 0,
    wins: 0,
    losses: 0,
    winPercentage: 0,
    currentStreak: 0,
    maxStreak: 0
  };
};

/**
 * Check if game was played today
 */
export const wasPlayedToday = (): boolean => {
  try {
    const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
    if (!lastPlayed) return false;
    
    const lastDate = new Date(lastPlayed);
    const today = new Date();
    return lastDate.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * Save last played date
 */
export const saveLastPlayedDate = (): void => {
  try {
    localStorage.setItem(LAST_PLAYED_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error saving date:', error);
  }
};

/**
 * Clear saved game state
 */
export const clearGameState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing game state:', error);
  }
};

/**
 * Reset all statistics
 */
export const resetStats = (): void => {
  try {
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_PLAYED_KEY);
    localStorage.removeItem(LAST_SUBMITTED_KEY);
  } catch (error) {
    console.error('Error resetting statistics:', error);
  }
};

/**
 * Save information about last statistics submission to blockchain
 */
export const saveLastSubmitted = (lastSubmitted: LastSubmitted): void => {
  try {
    localStorage.setItem(LAST_SUBMITTED_KEY, JSON.stringify(lastSubmitted));
  } catch (error) {
    console.error('Error saving last submission:', error);
  }
};

/**
 * Load information about last statistics submission to blockchain
 */
export const loadLastSubmitted = (): LastSubmitted | null => {
  try {
    const stored = localStorage.getItem(LAST_SUBMITTED_KEY);
    if (stored) {
      return JSON.parse(stored) as LastSubmitted;
    }
  } catch (error) {
    console.error('Error loading last submission:', error);
  }
  return null;
};

/**
 * Clear information about last submission (when resetting statistics)
 */
export const clearLastSubmitted = (): void => {
  try {
    localStorage.removeItem(LAST_SUBMITTED_KEY);
  } catch (error) {
    console.error('Error clearing last submission:', error);
  }
};
