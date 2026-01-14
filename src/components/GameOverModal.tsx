interface GameOverModalProps {
  isOpen: boolean;
  won: boolean;
  targetWord: string;
  attempts: number;
  onClose: () => void;
  onNewGame: () => void;
}

/**
 * Модальное окно окончания игры
 */
export const GameOverModal = ({
  isOpen,
  won,
  targetWord,
  attempts,
  onClose,
  onNewGame
}: GameOverModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 sm:p-8 max-w-md w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold mb-4">
          {won ? '🎉 Поздравляем!' : '😔 Игра окончена'}
        </h2>
        
        {won ? (
          <p className="text-lg mb-2">
            Вы угадали слово за {attempts} {attempts === 1 ? 'попытку' : attempts < 5 ? 'попытки' : 'попыток'}!
          </p>
        ) : (
          <p className="text-lg mb-2">
            Загаданное слово было: <span className="font-bold text-green-400">{targetWord}</span>
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onNewGame}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded transition-colors"
          >
            Новая игра
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
