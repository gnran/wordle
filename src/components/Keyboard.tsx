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

  // Calculate spacer width to center second row (9 keys) relative to first row (10 keys)
  // Spacer = (keyWidth + gap) / 2 to center properly
  // For mobile: (26px + 8px) / 2 = 17px
  // For sm: (32px + 10px) / 2 = 21px  
  // For md: (36px + 10px) / 2 = 23px
  const spacerWidth = 'w-[17px] sm:w-[21px] md:w-[23px]';

  return (
    <div className="flex flex-col gap-2 sm:gap-2.5 mx-auto items-center px-2 sm:px-3">
      {/* First row: 10 keys - defines the width */}
      <div className="flex gap-2 sm:gap-2.5 justify-center">
        {firstRow.map((key) => (
          <KeyButton key={key} letter={key} onClick={() => onKeyPress(key)} />
        ))}
      </div>
      
      {/* Second row: 9 keys - centered with equal padding on sides */}
      <div className="flex gap-2 sm:gap-2.5 justify-center">
        {/* Spacer to center 9 keys relative to 10 keys above */}
        <div className={`${spacerWidth} flex-shrink-0`}></div>
        {secondRow.map((key) => (
          <KeyButton key={key} letter={key} onClick={() => onKeyPress(key)} />
        ))}
        {/* Spacer to match the left spacer */}
        <div className={`${spacerWidth} flex-shrink-0`}></div>
      </div>
      
      {/* Third row: Backspace + 7 letters + Enter - matches first row width */}
      {/* First row width: 10 keys + 9 gaps = 10*26 + 9*8 = 332px (mobile), 10*32 + 9*10 = 410px (sm), 10*36 + 9*10 = 450px (md) */}
      {/* Third row needs: Backspace + 7 keys + Enter + 8 gaps = same as first row */}
      {/* So: Backspace + Enter = 332 - (7*26 + 8*8) = 332 - 246 = 86px total, 43px each (mobile) */}
      {/* sm: Backspace + Enter = 410 - (7*32 + 8*10) = 410 - 304 = 106px total, 53px each */}
      {/* md: Backspace + Enter = 450 - (7*36 + 8*10) = 450 - 332 = 118px total, 59px each */}
      <div className="flex gap-2 sm:gap-2.5 justify-center">
        <button
          onClick={onDelete}
          className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 w-[43px] h-8 sm:w-[53px] sm:h-10 md:w-[59px] md:h-12 text-xs sm:text-sm md:text-base font-semibold rounded-lg transition-colors active:scale-95 text-gray-800 dark:text-gray-200 flex items-center justify-center flex-shrink-0"
        >
          ⌫
        </button>
        {thirdRow.map((key) => (
          <KeyButton key={key} letter={key} onClick={() => onKeyPress(key)} />
        ))}
        <button
          onClick={onEnter}
          className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 w-[43px] h-8 sm:w-[53px] sm:h-10 md:w-[59px] md:h-12 text-xs sm:text-sm md:text-base font-semibold rounded-lg transition-colors active:scale-95 text-gray-800 dark:text-gray-200 flex items-center justify-center flex-shrink-0"
        >
          Enter
        </button>
      </div>
    </div>
  );
};
