import { LetterState, Letter } from '../types';

/**
 * Вычисляет состояние каждой буквы в предположении
 * @param guess - предположение игрока
 * @param targetWord - загаданное слово
 * @returns массив состояний букв
 */
export const evaluateGuess = (guess: string, targetWord: string): LetterState[] => {
  const result: LetterState[] = new Array(5).fill('absent');
  const targetLetters = targetWord.split('');
  const guessLetters = guess.split('');
  const usedIndices = new Set<number>();

  // Сначала находим правильные позиции (correct)
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = 'correct';
      usedIndices.add(i);
    }
  }

  // Затем находим буквы, которые есть в слове, но не на правильной позиции (present)
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;

    const letter = guessLetters[i];
    // Ищем букву в загаданном слове, которая еще не использована
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
 * Преобразует строку в массив букв с состояниями
 */
export const wordToLetters = (word: string, states: LetterState[]): Letter[] => {
  return word.split('').map((char, index) => ({
    value: char,
    state: states[index] || 'empty'
  }));
};

/**
 * Получить цвет для состояния буквы
 */
export const getLetterColor = (state: LetterState): string => {
  switch (state) {
    case 'correct':
      return 'bg-green-600 dark:bg-green-600';
    case 'present':
      return 'bg-yellow-500 dark:bg-yellow-500';
    case 'absent':
      return 'bg-gray-400 dark:bg-gray-600';
    default:
      return 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
  }
};
