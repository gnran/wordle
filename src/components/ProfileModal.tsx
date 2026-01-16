import { useState, useEffect } from 'react';
import React from 'react';
import { UserStats, UserInfo } from '../types';
import { formatWalletAddress } from '../utils/format';
import { submitStatsOnchain, getOnchainStats } from '../utils/contract';
import { sdk } from '@farcaster/miniapp-sdk';
import { BrowserProvider } from 'ethers';
// Removed loadStats and saveStats - ProfileModal uses ONLY blockchain data

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userInfo: UserInfo | null;
  onStatsUpdate?: (stats: UserStats) => void;
}

/**
 * Profile modal with statistics (fetches from blockchain only)
 */
export const ProfileModal = ({ isOpen, onClose, userInfo, onStatsUpdate }: ProfileModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | React.ReactNode | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | React.ReactNode | null>(null);
  const [displayStats, setDisplayStats] = useState<UserStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [hasFetchedBlockchain, setHasFetchedBlockchain] = useState(false);

  // Fetch fresh stats from blockchain when modal opens (blockchain is source of truth)
  useEffect(() => {
    // Reset flag when modal closes
    if (!isOpen) {
      setHasFetchedBlockchain(false);
      setDisplayStats(null);
      return;
    }

    // Don't initialize with stats prop - wait for blockchain data

    // Only fetch once when modal opens (don't refetch if already fetched)
    if (hasFetchedBlockchain) {
      return;
    }

    // If user info is available, try to fetch from blockchain
    if (userInfo?.fid) {
      setHasFetchedBlockchain(true);
      setIsLoadingStats(true);
      const fetchBlockchainStats = async () => {
        try {
          const provider = await sdk.wallet.getEthereumProvider();
          if (!provider) {
            console.warn('ProfileModal: No provider available');
            setIsLoadingStats(false);
            return;
          }

          // Get wallet address directly from provider to ensure we use the Farcaster wallet
          let accounts = await provider.request({ method: 'eth_accounts' });
          if (!accounts || accounts.length === 0) {
            try {
              accounts = await provider.request({ method: 'eth_requestAccounts' });
            } catch (requestError) {
              console.warn('ProfileModal: User did not provide wallet access');
              setIsLoadingStats(false);
              return;
            }
          }

          if (!accounts || accounts.length === 0) {
            console.warn('ProfileModal: No wallet accounts available');
            setIsLoadingStats(false);
            return;
          }

          const walletAddress = accounts[0];
          console.log('ProfileModal: Using Farcaster wallet address:', walletAddress);

          const browserProvider = new BrowserProvider(provider);
          const onchainStats = await getOnchainStats(walletAddress, browserProvider);
          
          console.log('ProfileModal: Blockchain stats received:', onchainStats);
          
          if (onchainStats) {
            // Use ONLY blockchain data - no local storage, no streaks
            const blockchainOnlyStats: UserStats = {
              totalGames: onchainStats.totalGames,
              wins: onchainStats.wins,
              losses: onchainStats.losses,
              winPercentage: onchainStats.winPercentage,
              currentStreak: 0, // Not stored on blockchain
              maxStreak: 0, // Not stored on blockchain
            };
            
            console.log('ProfileModal: Using ONLY blockchain data:', blockchainOnlyStats);
            console.log('ProfileModal: Setting displayStats to blockchain data:', blockchainOnlyStats.totalGames, 'games');
            setDisplayStats(blockchainOnlyStats);
            
            // Update parent component
            if (onStatsUpdate) {
              onStatsUpdate(blockchainOnlyStats);
            }
          } else {
            // Blockchain fetch returned null - show error, don't use fallback
            console.warn('ProfileModal: No blockchain stats found (returned null)');
            console.warn('ProfileModal: This might mean: 1) No data on chain, 2) Wrong network, 3) Contract error');
            // Keep displayStats as null to show "No stats available"
          }
        } catch (error) {
          console.error('ProfileModal: Error fetching blockchain stats:', error);
          console.error('ProfileModal: Error details:', error);
          // Keep displayStats as null on error - don't use fallback
        } finally {
          setIsLoadingStats(false);
        }
      };
      
      fetchBlockchainStats();
    } else {
      // No wallet - show message that wallet is needed
      console.log('ProfileModal: No wallet connected - blockchain data required');
      setDisplayStats(null);
      setHasFetchedBlockchain(true); // Mark as fetched to prevent re-running
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userInfo?.fid]);

  if (!isOpen) return null;

  const handleSubmitStats = async () => {
    // We'll get wallet address from provider, so no need to check userInfo.walletAddress

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

      // Get wallet address directly from provider
      let accounts = await provider.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        try {
          accounts = await provider.request({ method: 'eth_requestAccounts' });
        } catch (requestError) {
          setSubmitError('Wallet not connected. Please connect a wallet through Farcaster.');
          setIsSubmitting(false);
          return;
        }
      }

      if (!accounts || accounts.length === 0) {
        setSubmitError('No wallet accounts available');
        setIsSubmitting(false);
        return;
      }

      const walletAddress = accounts[0];
      console.log('ProfileModal: Submitting stats using Farcaster wallet:', walletAddress);

      const browserProvider = new BrowserProvider(provider);
      if (!displayStats) {
        setSubmitError('No stats available to submit');
        setIsSubmitting(false);
        return;
      }
      const result = await submitStatsOnchain(displayStats, walletAddress, browserProvider, userInfo.fid);

      if (result.success && result.txHash) {
        const txHash = result.txHash;
        const txLink = `https://basescan.org/tx/${txHash}`;
        
        // Reload stats from blockchain after successful submission (ONLY blockchain data)
        try {
          const onchainStats = await getOnchainStats(walletAddress, browserProvider);
          if (onchainStats) {
            // Use ONLY blockchain data - no local storage
            const blockchainOnlyStats: UserStats = {
              totalGames: onchainStats.totalGames,
              wins: onchainStats.wins,
              losses: onchainStats.losses,
              winPercentage: onchainStats.winPercentage,
              currentStreak: 0, // Not stored on blockchain
              maxStreak: 0, // Not stored on blockchain
            };
            
            setDisplayStats(blockchainOnlyStats);
            
            // Notify parent component to update stats
            if (onStatsUpdate) {
              onStatsUpdate(blockchainOnlyStats);
            }
          }
        } catch (reloadError) {
          console.error('Error reloading stats from blockchain:', reloadError);
        }
        
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
        className="bg-white dark:bg-[#0f1419] rounded-lg p-3 sm:p-6 md:p-8 max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
          <div className="flex items-center gap-2">
            {userInfo?.walletAddress && (
              <button
                onClick={() => {
                  console.log('ProfileModal: Manual refresh triggered');
                  setHasFetchedBlockchain(false);
                  setIsLoadingStats(true);
                  const fetchBlockchainStats = async () => {
                    try {
                      const provider = await sdk.wallet.getEthereumProvider();
                      if (!provider) {
                        console.warn('ProfileModal: No provider available for refresh');
                        setIsLoadingStats(false);
                        return;
                      }
                      
                      if (!userInfo?.walletAddress || !userInfo?.fid) {
                        console.warn('ProfileModal: Missing wallet address or FID');
                        setIsLoadingStats(false);
                        return;
                      }
                      
                      // Get wallet address directly from provider
                      let accounts = await provider.request({ method: 'eth_accounts' });
                      if (!accounts || accounts.length === 0) {
                        try {
                          accounts = await provider.request({ method: 'eth_requestAccounts' });
                        } catch (requestError) {
                          console.warn('ProfileModal: User did not provide wallet access for refresh');
                          setIsLoadingStats(false);
                          return;
                        }
                      }

                      if (!accounts || accounts.length === 0) {
                        console.warn('ProfileModal: No wallet accounts available for refresh');
                        setIsLoadingStats(false);
                        return;
                      }

                      const walletAddress = accounts[0];
                      console.log('ProfileModal: Refreshing stats from blockchain for Farcaster wallet:', walletAddress);
                      const browserProvider = new BrowserProvider(provider);
                      const onchainStats = await getOnchainStats(walletAddress, browserProvider);
                      
                      console.log('ProfileModal: Refresh - Blockchain stats received:', onchainStats);
                      
                      if (onchainStats) {
                        // Use ONLY blockchain data - no local storage
                        const blockchainOnlyStats: UserStats = {
                          totalGames: onchainStats.totalGames,
                          wins: onchainStats.wins,
                          losses: onchainStats.losses,
                          winPercentage: onchainStats.winPercentage,
                          currentStreak: 0, // Not stored on blockchain
                          maxStreak: 0, // Not stored on blockchain
                        };
                        console.log('ProfileModal: Refresh - Setting displayStats to blockchain data:', blockchainOnlyStats);
                        setDisplayStats(blockchainOnlyStats);
                        if (onStatsUpdate) {
                          onStatsUpdate(blockchainOnlyStats);
                        }
                      } else {
                        console.warn('ProfileModal: Refresh - No blockchain stats found');
                        // Keep displayStats as null - don't use fallback
                      }
                    } catch (error) {
                      console.error('ProfileModal: Error refreshing stats:', error);
                      // Keep displayStats as null on error - don't use fallback
                    } finally {
                      setIsLoadingStats(false);
                      setHasFetchedBlockchain(true);
                    }
                  };
                  fetchBlockchainStats();
                }}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
                title="Refresh from blockchain"
              >
                🔄
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xl sm:text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* User information */}
        {userInfo && (
          <div className="mb-3 sm:mb-6 pb-3 sm:pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
              {userInfo.pfpUrl ? (
                <img
                  src={userInfo.pfpUrl}
                  alt={userInfo.username || userInfo.displayName || 'User'}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-blue-500 dark:border-blue-400"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold border-2 border-blue-500 dark:border-blue-400">
                  {(userInfo.username || userInfo.displayName || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {userInfo.displayName || userInfo.username || 'User'}
                </div>
                {userInfo.username && userInfo.username !== userInfo.displayName && (
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    @{userInfo.username}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">FID:</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                  {userInfo.fid}
                </span>
              </div>
              {userInfo.walletAddress && (
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Wallet:</span>
                  <span className="text-xs sm:text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    {formatWalletAddress(userInfo.walletAddress)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics in card style */}
        <div className="mb-3 sm:mb-6">
          <div className="text-xs text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-0.5 sm:mb-1">LIFETIME</div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">All-time performance</h3>
          
          {isLoadingStats && (
            <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-sm">
              Loading stats from blockchain...
            </div>
          )}
          
          {displayStats ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Total games */}
              <div className="bg-blue-900/60 dark:bg-blue-900/60 rounded-lg p-2 sm:p-4">
                <div className="text-white text-xs font-bold uppercase tracking-wide mb-1 sm:mb-2">TOTAL GAMES</div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">{displayStats.totalGames}</div>
                <div className="text-gray-400 text-xs">All puzzles played</div>
              </div>

              {/* Wins */}
              <div className="bg-blue-900/60 dark:bg-blue-900/60 rounded-lg p-2 sm:p-4">
                <div className="text-white text-xs font-bold uppercase tracking-wide mb-1 sm:mb-2">WINS</div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">{displayStats.wins}</div>
                <div className="text-gray-400 text-xs">Games won</div>
              </div>

              {/* Losses */}
              <div className="bg-blue-900/60 dark:bg-blue-900/60 rounded-lg p-2 sm:p-4">
                <div className="text-white text-xs font-bold uppercase tracking-wide mb-1 sm:mb-2">LOSSES</div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">{displayStats.losses}</div>
                <div className="text-gray-400 text-xs">Games lost</div>
              </div>

              {/* Win percentage */}
              <div className="bg-blue-900/60 dark:bg-blue-900/60 rounded-lg p-2 sm:p-4">
                <div className="text-white text-xs font-bold uppercase tracking-wide mb-1 sm:mb-2">WIN PERCENTAGE</div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">
                  {displayStats.winPercentage > 0 ? `${displayStats.winPercentage.toFixed(1)}%` : '0%'}
                </div>
                <div className="text-gray-400 text-xs">Success rate</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-sm">
              No stats available
            </div>
          )}
        </div>

        {/* Blockchain stats submission button */}
        {userInfo?.walletAddress && (
          <div className="mb-2 sm:mb-4">
            <button
              onClick={handleSubmitStats}
              disabled={isSubmitting || !displayStats || displayStats.totalGames === 0}
              className="w-full bg-green-800 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-gray-200 font-semibold py-1.5 sm:py-2 px-3 sm:px-4 rounded transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
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

            {displayStats && displayStats.totalGames === 0 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                Play at least one game to submit statistics
              </p>
            )}
          </div>
        )}

        {!userInfo?.walletAddress && (
          <div className="mb-2 sm:mb-4 p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded text-xs sm:text-sm">
            To submit statistics to blockchain, please connect a wallet through Farcaster
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-blue-800 hover:bg-blue-700 text-gray-200 font-semibold py-1.5 sm:py-2 px-4 sm:px-6 rounded transition-colors text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
