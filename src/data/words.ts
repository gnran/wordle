// Словарь из words.json для игры Wordle
import wordsData from '../../words.json';

export const WORDS = wordsData.words.map((word: string) => word.toUpperCase());

// Все слова для проверки (включая словарь)
export const VALID_WORDS = [...WORDS];

// Получить случайное слово из словаря
export const getRandomWord = (): string => {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
};

// Проверить, является ли слово валидным
export const isValidWord = (word: string): boolean => {
  return VALID_WORDS.includes(word.toUpperCase());
};
