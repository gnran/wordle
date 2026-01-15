interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Letter block component for examples
 */
const LetterBlock = ({ 
  letter, 
  state 
}: { 
  letter: string; 
  state: 'correct' | 'present' | 'absent' | 'empty' 
}) => {
  const getColorClass = () => {
    switch (state) {
      case 'correct':
        return 'bg-green-500 dark:bg-green-600 text-white';
      case 'present':
        return 'bg-yellow-400 dark:bg-yellow-500 text-white';
      case 'absent':
        return 'bg-gray-500 dark:bg-gray-600 text-white';
      default:
        return 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div
      className={`
        w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12
        flex items-center justify-center
        text-base sm:text-lg font-bold
        border-2 rounded
        ${getColorClass()}
        ${state !== 'empty' ? 'border-transparent' : ''}
      `}
    >
      {letter}
    </div>
  );
};

/**
 * Small letter block component for legend (half size)
 */
const LetterBlockSmall = ({ 
  letter, 
  state 
}: { 
  letter: string; 
  state: 'correct' | 'present' | 'absent' | 'empty' 
}) => {
  const getColorClass = () => {
    switch (state) {
      case 'correct':
        return 'bg-green-500 dark:bg-green-600 text-white';
      case 'present':
        return 'bg-yellow-400 dark:bg-yellow-500 text-white';
      case 'absent':
        return 'bg-gray-500 dark:bg-gray-600 text-white';
      default:
        return 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div
      className={`
        w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6
        flex items-center justify-center
        text-[10px] sm:text-xs font-bold
        border-2 rounded
        ${getColorClass()}
        ${state !== 'empty' ? 'border-transparent' : ''}
      `}
    >
      {letter}
    </div>
  );
};

/**
 * Word example component
 */
const WordExample = ({ 
  word, 
  states 
}: { 
  word: string; 
  states: Array<'correct' | 'present' | 'absent' | 'empty'> 
}) => {
  return (
    <div className="flex gap-1.5 sm:gap-2 justify-center my-2 sm:my-3">
      {word.split('').map((letter, index) => (
        <LetterBlock key={index} letter={letter} state={states[index]} />
      ))}
    </div>
  );
};

/**
 * FAQ modal with "How to play" instructions
 */
export const FAQModal = ({ isOpen, onClose }: FAQModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0f1419] rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-100 dark:bg-gray-800 px-3 sm:px-4 py-2 sm:py-3 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white text-center flex-1">
              How to play
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xl sm:text-2xl ml-2 sm:ml-4"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 flex-1">
          <div className="space-y-3 sm:space-y-4">
            {/* Introduction */}
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
              You have to guess the hidden word in 6 tries and the color of the letters changes to show how close you are.
            </p>

            {/* First Example */}
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-2 text-sm sm:text-base">
                To start the game, just enter any word, for example:
              </p>
              <WordExample 
                word="CLONE" 
                states={['absent', 'present', 'absent', 'present', 'correct']} 
              />
              
              {/* Legend */}
              <div className="mt-2 sm:mt-3 p-2 sm:p-3 border-2 border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800">
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="flex gap-0.5 sm:gap-1 items-center">
                      <LetterBlockSmall letter="T" state="absent" />
                      <span className="text-gray-700 dark:text-gray-300 text-xs">,</span>
                      <LetterBlockSmall letter="B" state="absent" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                      aren't in the target word at all.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="flex gap-0.5 sm:gap-1 items-center">
                      <LetterBlockSmall letter="A" state="present" />
                      <span className="text-gray-700 dark:text-gray-300 text-xs">,</span>
                      <LetterBlockSmall letter="L" state="present" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                      is in the word but in the wrong spot.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <LetterBlockSmall letter="E" state="correct" />
                    <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                      is in the word and in the correct spot.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Example */}
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-2 text-sm sm:text-base">
                Another try to find matching letters in the target word.
              </p>
              <WordExample 
                word="UNCLE" 
                states={['absent', 'correct', 'absent', 'correct', 'correct']} 
              />
              <p className="text-center text-gray-700 dark:text-gray-300 font-semibold my-1 sm:my-2 text-sm sm:text-base">
                So close!
              </p>
              <WordExample 
                word="ANGLE" 
                states={['correct', 'correct', 'correct', 'correct', 'correct']} 
              />
              <p className="text-center text-gray-700 dark:text-gray-300 font-semibold my-1 sm:my-2 text-sm sm:text-base">
                Got it! 🏆
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-blue-800 hover:bg-blue-700 text-gray-200 font-semibold py-1.5 sm:py-2 px-4 rounded transition-colors text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
