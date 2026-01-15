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
  userInfo: UserInfo | null;
}

/**
 * Profile modal with statistics
 */
export const ProfileModal = ({ isOpen, onClose, stats, userInfo }: ProfileModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | React.ReactNode | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | React.ReactNode | null>(null);

  if (!isOpen) return null;

  const handleSubmitStats = async () => {
    if (!userInfo?.walletAddress) {
      setSubmitError('Wallet not connected. Please connect a wallet through Farcaster.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const provider = await sdk.wallet.getEthereumProvider();
      if (!provider) {
        setSubmitError('Failed to get wallet provider');
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
            <div className="font-semibold mb-2">✅ Statistics successfully submitted to blockchain!</div>
            <div className="text-sm mb-2">
              Transaction confirmed. Data written to contract.
            </div>
            <a
              href={txLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline text-sm mt-1 block"
            >
              📊 View transaction on BaseScan: {txHash.slice(0, 10)}...
            </a>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Note: Transaction may not appear immediately in wallet history. 
              Check status on BaseScan using the link above.
            </div>
          </div>
        );
        // Clear message after 15 seconds
        setTimeout(() => {
          setSubmitSuccess(null);
        }, 15000);
      } else {
        // If txHash exists but success = false, transaction was sent but not confirmed
        if (result.txHash) {
          const txLink = `https://basescan.org/tx/${result.txHash}`;
          setSubmitError(
            <div>
              <div>{result.error || 'Transaction sent but not confirmed'}</div>
              <a
                href={txLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline text-sm mt-1 block"
              >
                Check status: {result.txHash.slice(0, 10)}...
              </a>
            </div>
          );
        } else {
          setSubmitError(result.error || 'Unknown error');
        }
      }
    } catch (error: any) {
      console.error('Error submitting statistics:', error);
      const errorMessage = error?.message || error?.error?.message || String(error);
      // Remove addresses from error message
      const cleanError = errorMessage
        .replace(/0x[a-fA-F0-9]{40}/g, '[address]')
        .replace(/0x[a-fA-F0-9]{64}/g, '[hash]');
      setSubmitError(cleanError || 'An error occurred while submitting statistics');
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
        className="bg-white dark:bg-[#0f1419] rounded-lg p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* User information */}
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
                  {userInfo.displayName || userInfo.username || 'User'}
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">Wallet:</span>
                  <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    {formatWalletAddress(userInfo.walletAddress)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics in card style */}
        <div className="mb-6">
          <div className="text-xs text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1">LIFETIME</div>
          <h3 className="text-xl font-bold text-white mb-4">All-time performance</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Total games - dark purple-blue */}
            <div className="bg-[#2a1f3d] dark:bg-[#2a1f3d] rounded-lg p-4">
              <div className="text-white text-xs font-bold uppercase tracking-wide mb-2">TOTAL GAMES</div>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalGames}</div>
              <div className="text-gray-400 text-xs">All puzzles played</div>
            </div>

            {/* Wins - dark teal-green */}
            <div className="bg-[#1a2f2a] dark:bg-[#1a2f2a] rounded-lg p-4">
              <div className="text-white text-xs font-bold uppercase tracking-wide mb-2">WINS</div>
              <div className="text-3xl font-bold text-white mb-1">{stats.wins}</div>
              <div className="text-gray-400 text-xs">Games won</div>
            </div>

            {/* Losses - dark purple-blue */}
            <div className="bg-[#2a1f3d] dark:bg-[#2a1f3d] rounded-lg p-4">
              <div className="text-white text-xs font-bold uppercase tracking-wide mb-2">LOSSES</div>
              <div className="text-3xl font-bold text-white mb-1">{stats.losses}</div>
              <div className="text-gray-400 text-xs">Games lost</div>
            </div>

            {/* Win percentage - dark teal-green */}
            <div className="bg-[#1a2f2a] dark:bg-[#1a2f2a] rounded-lg p-4">
              <div className="text-white text-xs font-bold uppercase tracking-wide mb-2">WIN PERCENTAGE</div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.winPercentage > 0 ? `${stats.winPercentage.toFixed(1)}%` : '0%'}
              </div>
              <div className="text-gray-400 text-xs">Success rate</div>
            </div>
          </div>
        </div>

        {/* Blockchain stats submission button */}
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
                  <span>Submitting...</span>
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
                Play at least one game to submit statistics
              </p>
            )}
          </div>
        )}

        {!userInfo?.walletAddress && (
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded text-sm">
            To submit statistics to blockchain, please connect a wallet through Farcaster
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-blue-800 hover:bg-blue-700 text-gray-200 font-semibold py-2 px-6 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
