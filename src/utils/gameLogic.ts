import { LetterState, Letter } from '../types';

/**
 * Calculates state of each letter in guess
 * @param guess - player's guess
 * @param targetWord - target word
 * @returns array of letter states
 */
export const evaluateGuess = (guess: string, targetWord: string): LetterState[] => {
  const result: LetterState[] = new Array(5).fill('absent');
  const targetLetters = targetWord.split('');
  const guessLetters = guess.split('');
  const usedIndices = new Set<number>();

  // First find correct positions (correct)
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = 'correct';
      usedIndices.add(i);
    }
  }

  // Then find letters that are in word but not in correct position (present)
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;

    const letter = guessLetters[i];
    // Find letter in target word that hasn't been used yet
    for (let j = 0; j < 5; j++) {
      if (targetLetters[j] === letter && !usedIndices.has(j)) {
        result[i] = 'present';
        usedIndices.add(j);
        break;
      }
    }
  }

  return result;
};

/**
 * Converts string to array of letters with states
 */
export const wordToLetters = (word: string, states: LetterState[]): Letter[] => {
  return word.split('').map((char, index) => ({
    value: char,
    state: states[index] || 'empty'
  }));
};

/**
 * Get color for letter state
 */
export const getLetterColor = (state: LetterState): string => {
  switch (state) {
    case 'correct':
      return 'bg-green-500 dark:bg-green-600';
    case 'present':
      return 'bg-yellow-400 dark:bg-yellow-500';
    case 'absent':
      return 'bg-gray-500 dark:bg-gray-600';
    default:
      return 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
  }
};
