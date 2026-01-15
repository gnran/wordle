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
        min-w-[20px] h-11 px-1
        sm:min-w-[26px] sm:h-14 sm:px-1.5
        md:min-w-[28px] md:h-16 md:px-2
        text-xs sm:text-sm md:text-base font-bold
        rounded-lg
        transition-colors
        active:scale-95
        flex items-center justify-center
        flex-1
        ${letterStates[letter] && letterStates[letter] !== 'empty' ? 'text-white' : 'text-gray-800 dark:text-gray-200'}
      `}
    >
      {letter}
    </button>
  );

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3 md:gap-3.5 mx-auto w-full max-w-full px-1 sm:px-2">
      {/* First row: 10 keys - defines the width */}
      <div className="flex gap-1 sm:gap-2 md:gap-2.5 justify-start w-full max-w-full">
        {firstRow.map((key) => (
          <KeyButton key={key} letter={key} onClick={() => onKeyPress(key)} />
        ))}
      </div>
      
      {/* Second row: 9 keys - centered with equal padding on sides */}
      <div className="flex gap-1 sm:gap-2 md:gap-2.5 justify-center w-full max-w-full">
        {secondRow.map((key) => (
          <KeyButton key={key} letter={key} onClick={() => onKeyPress(key)} />
        ))}
      </div>
      
      {/* Third row: Backspace + 7 letters + Enter - matches first row width */}
      <div className="flex gap-1 sm:gap-2 md:gap-2.5 justify-start w-full max-w-full">
        <button
          onClick={onDelete}
          className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 min-w-[48px] h-11 sm:min-w-[64px] sm:h-14 md:min-w-[72px] md:h-16 text-xs sm:text-sm md:text-base font-semibold rounded-lg transition-colors active:scale-95 text-gray-800 dark:text-gray-200 flex items-center justify-center flex-shrink-0 px-2 sm:px-3"
        >
          ⌫
        </button>
        {thirdRow.map((key) => (
          <KeyButton key={key} letter={key} onClick={() => onKeyPress(key)} />
        ))}
        <button
          onClick={onEnter}
          className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 min-w-[48px] h-11 sm:min-w-[64px] sm:h-14 md:min-w-[72px] md:h-16 text-xs sm:text-sm md:text-base font-semibold rounded-lg transition-colors active:scale-95 text-gray-800 dark:text-gray-200 flex items-center justify-center flex-shrink-0 px-2 sm:px-3"
        >
          Enter
        </button>
      </div>
    </div>
  );
};
