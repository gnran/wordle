// Dictionary from words.json for Wordle game
import wordsData from '../../words.json';

export const WORDS = wordsData.words.map((word: string) => word.toUpperCase());

// All words for validation (including dictionary)
export const VALID_WORDS = [...WORDS];

// Get random word from dictionary
export const getRandomWord = (): string => {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
};

// Check if word is valid
export const isValidWord = (word: string): boolean => {
  return VALID_WORDS.includes(word.toUpperCase());
};
