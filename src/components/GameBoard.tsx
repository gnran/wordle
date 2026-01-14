import { Letter } from '../types';
import { getLetterColor } from '../utils/gameLogic';

interface GameBoardProps {
  rows: Letter[][];
  currentRow: number;
  currentGuess: string;
}

/**
 * Компонент игрового поля - отображает сетку 6x5 для угадывания слов
 */
export const GameBoard = ({ rows, currentRow, currentGuess }: GameBoardProps) => {
  return (
    <div className="flex flex-col gap-1.5 mb-8">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1.5 justify-center">
          {row.map((letter, letterIndex) => {
            const isCurrentRow = rowIndex === currentRow;
            const isEmpty = letter.state === 'empty';
            const showLetter = !isEmpty || (isCurrentRow && letterIndex < currentGuess.length);
            
            return (
              <div
                key={letterIndex}
                className={`
                  w-10 h-10 sm:w-12 sm:h-12
                  flex items-center justify-center
                  text-xl font-bold
                  border-2 rounded
                  transition-all duration-300
                  ${isEmpty && !showLetter 
                    ? 'bg-gray-800 border-gray-600' 
                    : getLetterColor(letter.state)
                  }
                  ${letter.state !== 'empty' ? 'border-transparent text-white' : 'text-gray-300'}
                `}
              >
                {showLetter ? letter.value : ''}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
