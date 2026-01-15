import { UserStats } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  onResetStats: () => void;
}

/**
 * Модальное окно профиля со статистикой
 */
export const ProfileModal = ({ isOpen, onClose, stats, onResetStats }: ProfileModalProps) => {
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Профиль</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-100 dark:bg-gray-700 rounded p-4">
            <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Всего игр</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalGames}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-4">
              <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Побед</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.wins}</div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 rounded p-4">
              <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Поражений</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.losses}</div>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-700 rounded p-4">
            <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Процент побед</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.winPercentage > 0 ? `${stats.winPercentage.toFixed(1)}%` : '0%'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-4">
              <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Текущая серия</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.currentStreak}</div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 rounded p-4">
              <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Лучшая серия</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.maxStreak}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onResetStats}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Сбросить статистику
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
