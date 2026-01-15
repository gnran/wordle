interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Модальное окно FAQ (пока пустое)
 */
export const FAQModal = ({ isOpen, onClose }: FAQModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">FAQ</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">FAQ пока пуст</p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};
