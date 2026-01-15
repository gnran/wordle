import { useState } from 'react';
import React from 'react';
import { UserStats, UserInfo } from '../types';
import { formatWalletAddress } from '../utils/format';
import { submitStatsOnchain } from '../utils/contract';
import { sdk } from '@farcaster/miniapp-sdk';
import { BrowserProvider } from 'ethers';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | React.ReactNode | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | React.ReactNode | null>(null);

  if (!isOpen) return null;

  const handleSubmitStats = async () => {
    if (!userInfo?.walletAddress) {
      setSubmitError('Кошелек не подключен. Пожалуйста, подключите кошелек через Farcaster.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const provider = await sdk.wallet.getEthereumProvider();
      if (!provider) {
        setSubmitError('Не удалось получить провайдер кошелька');
        setIsSubmitting(false);
        return;
      }

      const browserProvider = new BrowserProvider(provider);
      const result = await submitStatsOnchain(stats, userInfo.walletAddress, browserProvider);

      if (result.success && result.txHash) {
        const txHash = result.txHash;
        const txLink = `https://basescan.org/tx/${txHash}`;
        setSubmitSuccess(
          <div>
            <div>Статистика успешно отправлена!</div>
            <a
              href={txLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline text-sm mt-1 block"
            >
              Просмотреть транзакцию: {txHash.slice(0, 10)}...
            </a>
          </div>
        );
        // Очищаем сообщение через 10 секунд
        setTimeout(() => {
          setSubmitSuccess(null);
        }, 10000);
      } else {
        // Если есть txHash, но success = false, значит транзакция отправлена, но не подтверждена
        if (result.txHash) {
          const txLink = `https://basescan.org/tx/${result.txHash}`;
          setSubmitError(
            <div>
              <div>{result.error || 'Транзакция отправлена, но не подтверждена'}</div>
              <a
                href={txLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline text-sm mt-1 block"
              >
                Проверить статус: {result.txHash.slice(0, 10)}...
              </a>
            </div>
          );
        } else {
          setSubmitError(result.error || 'Неизвестная ошибка');
        }
      }
    } catch (error: any) {
      console.error('Ошибка отправки статистики:', error);
      const errorMessage = error?.message || error?.error?.message || String(error);
      // Убираем адреса из сообщения об ошибке
      const cleanError = errorMessage
        .replace(/0x[a-fA-F0-9]{40}/g, '[адрес]')
        .replace(/0x[a-fA-F0-9]{64}/g, '[хеш]');
      setSubmitError(cleanError || 'Произошла ошибка при отправке статистики');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Кнопка отправки статистики в блокчейн */}
        {userInfo?.walletAddress && (
          <div className="mb-4">
            <button
              onClick={handleSubmitStats}
              disabled={isSubmitting || stats.totalGames === 0}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Отправка...</span>
                </>
              ) : (
                <span>Submit stats onchain</span>
              )}
            </button>

            {submitError && (
              <div className="mt-2 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2 rounded text-sm">
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="mt-2 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-2 rounded text-sm">
                {submitSuccess}
              </div>
            )}

            {stats.totalGames === 0 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                Сыграйте хотя бы одну игру, чтобы отправить статистику
              </p>
            )}
          </div>
        )}

        {!userInfo?.walletAddress && (
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded text-sm">
            Для отправки статистики в блокчейн необходимо подключить кошелек через Farcaster
          </div>
        )}

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
