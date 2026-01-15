import { LetterState } from '../types';
import { getLetterColor } from '../utils/gameLogic';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  letterStates: Record<string, LetterState>;
}

/**
 * Virtual keyboard component
 */
export const Keyboard = ({ onKeyPress, onDelete, onEnter, letterStates }: KeyboardProps) => {
  const firstRow = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const secondRow = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
  const thirdRow = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

  const getKeyColor = (key: string): string => {
    const state = letterStates[key];
    if (!state || state === 'empty') {
      return 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600';
    }
    return getLetterColor(state);
  };

  const KeyButton = ({ letter, onClick }: { letter: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`
        ${getKeyColor(letter)}
        w-9 h-10 sm:w-10 sm:h-12
        text-sm sm:text-base font-bold
        rounded-lg
        transition-colors
        active:scale-95
        flex items-center justify-center
        flex-shrink-0
        ${letterStates[letter] && letterStates[letter] !== 'empty' ? 'text-white' : 'text-gray-800 dark:text-gray-200'}
      `}
    >
      {letter}
    </button>
  );

  return (
    <div className="flex flex-col gap-2 mx-auto px-1 sm:px-2">
      {/* First row: 10 keys - defines the width */}
      <div className="flex gap-1 justify-start w-[22rem] sm:w-[27.25rem] mx-auto">
        {firstRow.map((key) => (
          <KeyButton key={key} letter={key} onClick={() => onKeyPress(key)} />
        ))}
      </div>
      
      {/* Second row: 9 keys - centered with equal padding on sides */}
      <div className="flex gap-1 justify-center w-[22rem] sm:w-[27.25rem] mx-auto">
        {secondRow.map((key) => (
          <KeyButton key={key} letter={key} onClick={() => onKeyPress(key)} />
        ))}
      </div>
      
      {/* Third row: Backspace + 7 letters + Enter - matches first row width */}
      <div className="flex gap-1 justify-start w-[22rem] sm:w-[27.25rem] mx-auto">
        <button
          onClick={onDelete}
          className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 w-14 h-10 sm:w-16 sm:h-12 text-sm sm:text-base font-semibold rounded-lg transition-colors active:scale-95 text-gray-800 dark:text-gray-200 flex items-center justify-center flex-shrink-0"
        >
          ⌫
        </button>
        {thirdRow.map((key) => (
          <KeyButton key={key} letter={key} onClick={() => onKeyPress(key)} />
        ))}
        <button
          onClick={onEnter}
          className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 w-14 h-10 sm:w-16 sm:h-12 text-sm sm:text-base font-semibold rounded-lg transition-colors active:scale-95 text-gray-800 dark:text-gray-200 flex items-center justify-center flex-shrink-0"
        >
          Enter
        </button>
      </div>
    </div>
  );
};
