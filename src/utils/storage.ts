import { GameState, UserStats, LastSubmitted } from '../types';

// Legacy keys for migration
const LEGACY_STORAGE_KEY = 'wordle-game-state';
const LEGACY_STATS_KEY = 'wordle-stats';
const LEGACY_LAST_PLAYED_KEY = 'wordle-last-played';
const LEGACY_LAST_SUBMITTED_KEY = 'wordle-last-submitted';

/**
 * Get storage key for a specific FID
 */
const getStorageKey = (fid: number | null, baseKey: string): string => {
  if (fid === null) {
    // Use temporary key for unauthenticated users
    return `${baseKey}-temp`;
  }
  return `${baseKey}-fid-${fid}`;
};

/**
 * Save game state to localStorage (FID-based)
 */
export const saveGameState = (gameState: GameState, fid: number | null = null): void => {
  try {
    const key = getStorageKey(fid, 'wordle-game-state');
    localStorage.setItem(key, JSON.stringify(gameState));
  } catch (error) {
    console.error('Error saving game state:', error);
  }
};

/**
 * Load game state from localStorage (FID-based)
 */
export const loadGameState = (fid: number | null = null): GameState | null => {
  try {
    const key = getStorageKey(fid, 'wordle-game-state');
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as GameState;
  } catch (error) {
    console.error('Error loading game state:', error);
    return null;
  }
};

/**
 * Save user statistics (FID-based)
 */
export const saveStats = (stats: UserStats, fid: number | null = null): void => {
  try {
    const key = getStorageKey(fid, 'wordle-stats');
    localStorage.setItem(key, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving statistics:', error);
  }
};

/**
 * Load user statistics (FID-based)
 */
export const loadStats = (fid: number | null = null): UserStats => {
  try {
    const key = getStorageKey(fid, 'wordle-stats');
    const stored = localStorage.getItem(key);
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
 * Check if game was played today (FID-based)
 */
export const wasPlayedToday = (fid: number | null = null): boolean => {
  try {
    const key = getStorageKey(fid, 'wordle-last-played');
    const lastPlayed = localStorage.getItem(key);
    if (!lastPlayed) return false;
    
    const lastDate = new Date(lastPlayed);
    const today = new Date();
    return lastDate.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * Save last played date (FID-based)
 */
export const saveLastPlayedDate = (fid: number | null = null): void => {
  try {
    const key = getStorageKey(fid, 'wordle-last-played');
    localStorage.setItem(key, new Date().toISOString());
  } catch (error) {
    console.error('Error saving date:', error);
  }
};

/**
 * Clear saved game state (FID-based)
 */
export const clearGameState = (fid: number | null = null): void => {
  try {
    const key = getStorageKey(fid, 'wordle-game-state');
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing game state:', error);
  }
};

/**
 * Reset all statistics (FID-based)
 */
export const resetStats = (fid: number | null = null): void => {
  try {
    const statsKey = getStorageKey(fid, 'wordle-stats');
    const gameStateKey = getStorageKey(fid, 'wordle-game-state');
    const lastPlayedKey = getStorageKey(fid, 'wordle-last-played');
    const lastSubmittedKey = getStorageKey(fid, 'wordle-last-submitted');
    
    localStorage.removeItem(statsKey);
    localStorage.removeItem(gameStateKey);
    localStorage.removeItem(lastPlayedKey);
    localStorage.removeItem(lastSubmittedKey);
  } catch (error) {
    console.error('Error resetting statistics:', error);
  }
};

/**
 * Save information about last statistics submission to blockchain (FID-based)
 */
export const saveLastSubmitted = (lastSubmitted: LastSubmitted, fid: number | null = null): void => {
  try {
    const key = getStorageKey(fid, 'wordle-last-submitted');
    localStorage.setItem(key, JSON.stringify(lastSubmitted));
  } catch (error) {
    console.error('Error saving last submission:', error);
  }
};

/**
 * Load information about last statistics submission to blockchain (FID-based)
 */
export const loadLastSubmitted = (fid: number | null = null): LastSubmitted | null => {
  try {
    const key = getStorageKey(fid, 'wordle-last-submitted');
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as LastSubmitted;
    }
  } catch (error) {
    console.error('Error loading last submission:', error);
  }
  return null;
};

/**
 * Clear information about last submission (when resetting statistics) (FID-based)
 */
export const clearLastSubmitted = (fid: number | null = null): void => {
  try {
    const key = getStorageKey(fid, 'wordle-last-submitted');
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing last submission:', error);
  }
};

/**
 * Check if user is new (has never submitted stats to blockchain)
 */
export const isNewUser = (fid: number | null = null): boolean => {
  const lastSubmitted = loadLastSubmitted(fid);
  return lastSubmitted === null;
};

/**
 * Migrate legacy stats to FID-based storage
 * This should be called when a user logs in for the first time
 */
export const migrateLegacyStats = (fid: number): boolean => {
  try {
    let migrated = false;

    // Migrate stats
    const legacyStats = localStorage.getItem(LEGACY_STATS_KEY);
    if (legacyStats) {
      const fidKey = getStorageKey(fid, 'wordle-stats');
      const existingFidStats = localStorage.getItem(fidKey);
      
      // Only migrate if FID-based stats don't exist
      if (!existingFidStats) {
        localStorage.setItem(fidKey, legacyStats);
        migrated = true;
      }
    }

    // Migrate game state
    const legacyGameState = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyGameState) {
      const fidKey = getStorageKey(fid, 'wordle-game-state');
      const existingFidGameState = localStorage.getItem(fidKey);
      
      if (!existingFidGameState) {
        localStorage.setItem(fidKey, legacyGameState);
        migrated = true;
      }
    }

    // Migrate last played date
    const legacyLastPlayed = localStorage.getItem(LEGACY_LAST_PLAYED_KEY);
    if (legacyLastPlayed) {
      const fidKey = getStorageKey(fid, 'wordle-last-played');
      const existingFidLastPlayed = localStorage.getItem(fidKey);
      
      if (!existingFidLastPlayed) {
        localStorage.setItem(fidKey, legacyLastPlayed);
        migrated = true;
      }
    }

    // Migrate last submitted
    const legacyLastSubmitted = localStorage.getItem(LEGACY_LAST_SUBMITTED_KEY);
    if (legacyLastSubmitted) {
      const fidKey = getStorageKey(fid, 'wordle-last-submitted');
      const existingFidLastSubmitted = localStorage.getItem(fidKey);
      
      if (!existingFidLastSubmitted) {
        localStorage.setItem(fidKey, legacyLastSubmitted);
        migrated = true;
      }
    }

    return migrated;
  } catch (error) {
    console.error('Error migrating legacy stats:', error);
    return false;
  }
};
