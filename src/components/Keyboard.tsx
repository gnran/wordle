import { LetterState } from '../types';
import { getLetterColor } from '../utils/gameLogic';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  letterStates: Record<string, LetterState>;
}

/**
 * Компонент виртуальной клавиатуры
 */
export const Keyboard = ({ onKeyPress, onDelete, letterStates }: KeyboardProps) => {
  const firstRow = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const secondRow = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
  const thirdRow = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

  const getKeyColor = (key: string): string => {
    const state = letterStates[key];
    if (!state || state === 'empty') {
      return 'bg-gray-700 hover:bg-gray-600';
    }
    return getLetterColor(state);
  };

  const KeyButton = ({ letter, onClick }: { letter: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`
        ${getKeyColor(letter)}
        px-2 py-1.5 sm:px-3 sm:py-3 md:px-4 md:py-4
        text-xs sm:text-sm md:text-base font-semibold
        rounded
        transition-colors
        active:scale-95
        ${letterStates[letter] && letterStates[letter] !== 'empty' ? 'text-white' : 'text-gray-200'}
      `}
    >
      {letter}
    </button>
  );

  return (
    <div className="flex flex-col gap-2 max-w-2xl mx-auto px-2">
      <div className="flex gap-1 justify-center flex-wrap">
        {firstRow.map((key) => (
          <KeyButton key={key} letter={key} onClick={() => onKeyPress(key)} />
        ))}
      </div>
      <div className="flex gap-1 justify-center flex-wrap">
        {secondRow.map((key) => (
          <KeyButton key={key} letter={key} onClick={() => onKeyPress(key)} />
        ))}
      </div>
      <div className="flex gap-1 justify-center flex-wrap">
        {thirdRow.map((key) => (
          <KeyButton key={key} letter={key} onClick={() => onKeyPress(key)} />
        ))}
        <button
          onClick={onDelete}
          className="bg-gray-700 hover:bg-gray-600 px-2 py-1.5 sm:px-4 sm:py-3 md:px-6 md:py-4 text-xs sm:text-sm md:text-base font-semibold rounded transition-colors active:scale-95 text-gray-200"
        >
          ⌫
        </button>
      </div>
    </div>
  );
};
