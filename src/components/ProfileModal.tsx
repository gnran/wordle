import { UserStats, UserInfo } from '../types';
import { formatWalletAddress } from '../utils/format';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  onResetStats: () => void;
  userInfo: UserInfo | null;
}

/**
 * Модальное окно профиля со статистикой
 */
export const ProfileModal = ({ isOpen, onClose, stats, onResetStats, userInfo }: ProfileModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
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

        {/* Информация о пользователе */}
        {userInfo && (
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 mb-4">
              {userInfo.pfpUrl ? (
                <img
                  src={userInfo.pfpUrl}
                  alt={userInfo.username || userInfo.displayName || 'User'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 dark:border-blue-400"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-blue-500 dark:border-blue-400">
                  {(userInfo.username || userInfo.displayName || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {userInfo.displayName || userInfo.username || 'Пользователь'}
                </div>
                {userInfo.username && userInfo.username !== userInfo.displayName && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    @{userInfo.username}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">FID:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {userInfo.fid}
                </span>
              </div>
              {userInfo.walletAddress && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Кошелек:</span>
                  <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    {formatWalletAddress(userInfo.walletAddress)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

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
