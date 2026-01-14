import { GameState, UserStats } from '../types';

const STORAGE_KEY = 'wordle-game-state';
const STATS_KEY = 'wordle-stats';
const LAST_PLAYED_KEY = 'wordle-last-played';

/**
 * Сохранить состояние игры в localStorage
 */
export const saveGameState = (gameState: GameState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  } catch (error) {
    console.error('Ошибка сохранения состояния игры:', error);
  }
};

/**
 * Загрузить состояние игры из localStorage
 */
export const loadGameState = (): GameState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as GameState;
  } catch (error) {
    console.error('Ошибка загрузки состояния игры:', error);
    return null;
  }
};

/**
 * Сохранить статистику пользователя
 */
export const saveStats = (stats: UserStats): void => {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Ошибка сохранения статистики:', error);
  }
};

/**
 * Загрузить статистику пользователя
 */
export const loadStats = (): UserStats => {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
      return JSON.parse(stored) as UserStats;
    }
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }

  // Возвращаем статистику по умолчанию
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
 * Проверить, была ли игра сегодня
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
 * Сохранить дату последней игры
 */
export const saveLastPlayedDate = (): void => {
  try {
    localStorage.setItem(LAST_PLAYED_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Ошибка сохранения даты:', error);
  }
};

/**
 * Очистить сохраненное состояние игры
 */
export const clearGameState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Ошибка очистки состояния игры:', error);
  }
};

/**
 * Сбросить всю статистику
 */
export const resetStats = (): void => {
  try {
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_PLAYED_KEY);
  } catch (error) {
    console.error('Ошибка сброса статистики:', error);
  }
};
