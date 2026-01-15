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
        w-[26px] h-8
        sm:w-[32px] sm:h-10
        md:w-[36px] md:h-12
        text-xs sm:text-sm md:text-base font-bold
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
    <div className="flex flex-col gap-2 sm:gap-2.5 mx-auto w-full max-w-full px-2 sm:px-3">
      {/* First row: 10 keys - defines the width */}
      <div className="flex gap-2 sm:gap-2.5 justify-start w-full max-w-full">
        {firstRow.map((key) => (
          <KeyButton key={key} letter={key} onClick={() => onKeyPress(key)} />
        ))}
      </div>
      
      {/* Second row: 9 keys - centered with equal padding on sides */}
      <div className="flex gap-2 sm:gap-2.5 justify-center w-full max-w-full">
        {secondRow.map((key) => (
          <KeyButton key={key} letter={key} onClick={() => onKeyPress(key)} />
        ))}
      </div>
      
      {/* Third row: Backspace + 7 letters + Enter - matches first row width */}
      <div className="flex gap-2 sm:gap-2.5 justify-start w-full max-w-full">
        <button
          onClick={onDelete}
          className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 w-[38px] h-8 sm:w-[48px] sm:h-10 md:w-[56px] md:h-12 text-xs sm:text-sm md:text-base font-semibold rounded-lg transition-colors active:scale-95 text-gray-800 dark:text-gray-200 flex items-center justify-center flex-shrink-0"
        >
          ⌫
        </button>
        {thirdRow.map((key) => (
          <KeyButton key={key} letter={key} onClick={() => onKeyPress(key)} />
        ))}
        <button
          onClick={onEnter}
          className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 w-[38px] h-8 sm:w-[48px] sm:h-10 md:w-[56px] md:h-12 text-xs sm:text-sm md:text-base font-semibold rounded-lg transition-colors active:scale-95 text-gray-800 dark:text-gray-200 flex items-center justify-center flex-shrink-0"
        >
          Enter
        </button>
      </div>
    </div>
  );
};
