import { BrowserProvider, Contract, Signer, JsonRpcProvider } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CONTRACT_CHAIN_ID } from '../config/contract';
import { UserStats, LastSubmitted } from '../types';
import { loadLastSubmitted, saveLastSubmitted } from './storage';

/**
 * Calculate delta between local statistics and last submitted
 */
export function calculateDelta(
  localStats: UserStats,
  lastSubmitted: LastSubmitted | null
): { deltaWins: number; deltaLosses: number; expectedNonce: number } {
  if (!lastSubmitted) {
    return {
      deltaWins: localStats.wins,
      deltaLosses: localStats.losses,
      expectedNonce: 0,
    };
  }

  const deltaWins = localStats.wins - lastSubmitted.wins;
  const deltaLosses = localStats.losses - lastSubmitted.losses;
  const expectedNonce = lastSubmitted.nonce;

  return { deltaWins, deltaLosses, expectedNonce };
}

/**
 * Validate delta before submission
 */
export function validateDelta(
  deltaWins: number,
  deltaLosses: number
): { valid: boolean; error?: string } {
  if (deltaWins < 0 || deltaLosses < 0) {
    return {
      valid: false,
      error: 'Delta cannot be negative',
    };
  }

  const deltaGames = deltaWins + deltaLosses;

  if (deltaGames === 0) {
    return {
      valid: false,
      error: 'Nothing to submit',
    };
  }

  if (deltaGames > 200) {
    return {
      valid: false,
      error: 'Batch too large (maximum 200 games)',
    };
  }

  return { valid: true };
}

/**
 * Get contract instance
 */
export async function getContract(provider: BrowserProvider): Promise<Contract> {
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

/**
 * Get contract instance with signer (for transactions)
 */
export async function getContractWithSigner(signer: Signer): Promise<Contract> {
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Check connection to correct network
 */
export async function checkNetwork(
  provider: BrowserProvider
): Promise<{ correct: boolean; chainId?: number; error?: string }> {
  try {
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const correct = chainId === CONTRACT_CHAIN_ID;

    if (!correct) {
      return {
        correct: false,
        chainId,
        error: `Wrong network. Expected Base (${CONTRACT_CHAIN_ID}), got ${chainId}`,
      };
    }

    return { correct: true, chainId };
  } catch (error: any) {
    return {
      correct: false,
      error: error.message || 'Network check error',
    };
  }
}

/**
 * Switch to Base network
 */
export async function switchToBaseNetwork(
  provider: BrowserProvider
): Promise<{ success: boolean; error?: string }> {
  const networkName = CONTRACT_CHAIN_ID === 8453 ? 'Base' : 'Base Sepolia';
  const rpcUrl =
    CONTRACT_CHAIN_ID === 8453
      ? 'https://mainnet.base.org'
      : 'https://sepolia.base.org';
  const explorerUrl =
    CONTRACT_CHAIN_ID === 8453
      ? 'https://basescan.org'
      : 'https://sepolia.basescan.org';

  try {
    await provider.send('wallet_switchEthereumChain', [
      { chainId: `0x${CONTRACT_CHAIN_ID.toString(16)}` },
    ]);
    return { success: true };
  } catch (error: any) {
    // Chain not added, try to add it
    if (error.code === 4902) {
      try {
        await provider.send('wallet_addEthereumChain', [
          {
            chainId: `0x${CONTRACT_CHAIN_ID.toString(16)}`,
            chainName: networkName,
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: [rpcUrl],
            blockExplorerUrls: [explorerUrl],
          },
        ]);
        return { success: true };
      } catch (addError: any) {
        return {
          success: false,
          error: `Failed to add network: ${addError.message}`,
        };
      }
    }
    return {
      success: false,
      error: `Failed to switch network: ${error.message}`,
    };
  }
}

/**
 * Get current nonce from contract
 */
export async function getCurrentNonce(
  playerAddress: string,
  provider: BrowserProvider
): Promise<number> {
  try {
    const contract = await getContract(provider);
    const nonce = await contract.getNonce(playerAddress);
    return Number(nonce);
  } catch (error) {
    console.error('Error getting nonce:', error);
    return 0;
  }
}

/**
 * Submit statistics to blockchain
 */
export async function submitStatsOnchain(
  localStats: UserStats,
  walletAddress: string,
  provider: BrowserProvider,
  fid: number | null = null
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> {
  try {
    // Network check
    const networkCheck = await checkNetwork(provider);
    if (!networkCheck.correct) {
      const switchResult = await switchToBaseNetwork(provider);
      if (!switchResult.success) {
        return {
          success: false,
          error: networkCheck.error || switchResult.error,
        };
      }
      // Recheck after switching
      const recheck = await checkNetwork(provider);
      if (!recheck.correct) {
        return {
          success: false,
          error: 'Failed to switch to correct network',
        };
      }
    }

    // Load last submitted statistics (FID-based)
    let lastSubmitted = loadLastSubmitted(fid);

    // Get current nonce from contract
    let currentNonce = await getCurrentNonce(walletAddress, provider);

    // If lastSubmitted is missing but contract already has data (nonce > 0),
    // need to sync: get statistics from contract
    if (!lastSubmitted && currentNonce > 0) {
      const onchainStats = await getOnchainStats(walletAddress, provider);
      if (onchainStats) {
        // Sync lastSubmitted with contract data
        lastSubmitted = {
          games: onchainStats.totalGames,
          wins: onchainStats.wins,
          losses: onchainStats.losses,
          nonce: onchainStats.nonce,
        };
        saveLastSubmitted(lastSubmitted, fid);
      }
    }

    // Calculate delta
    let { deltaWins, deltaLosses, expectedNonce } = calculateDelta(
      localStats,
      lastSubmitted
    );

    // Validate delta
    let validation = validateDelta(deltaWins, deltaLosses);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Check nonce match - if mismatch, sync with contract and recalculate
    if (currentNonce !== expectedNonce) {
      console.warn(`Nonce mismatch detected. Expected: ${expectedNonce}, Contract has: ${currentNonce}. Syncing with contract...`);
      
      // Get actual stats from contract to sync
      const onchainStats = await getOnchainStats(walletAddress, provider);
      if (onchainStats) {
        // Update lastSubmitted with contract's actual state
        lastSubmitted = {
          games: onchainStats.totalGames,
          wins: onchainStats.wins,
          losses: onchainStats.losses,
          nonce: onchainStats.nonce,
        };
        saveLastSubmitted(lastSubmitted, fid);
        
        // Recalculate delta with synced data
        const recalculated = calculateDelta(localStats, lastSubmitted);
        deltaWins = recalculated.deltaWins;
        deltaLosses = recalculated.deltaLosses;
        expectedNonce = recalculated.expectedNonce;
        
        // Validate the new delta
        validation = validateDelta(deltaWins, deltaLosses);
        if (!validation.valid) {
          return { success: false, error: validation.error || 'Nothing to submit after sync' };
        }
        
        // Re-check nonce after sync
        const recheckNonce = await getCurrentNonce(walletAddress, provider);
        if (recheckNonce !== expectedNonce) {
          return {
            success: false,
            error: `Nonce still mismatched after sync. Expected ${expectedNonce}, got ${recheckNonce}. Please try again.`,
          };
        }
        
        // Update currentNonce to match expectedNonce for consistency
        currentNonce = recheckNonce;
        
        console.log('Successfully synced with contract. Proceeding with submission...');
      } else {
        // Couldn't get stats from contract - might be a new user or network issue
        if (currentNonce > 0 && !lastSubmitted) {
          return {
            success: false,
            error: `Statistics found in blockchain but couldn't load them. Please refresh page and try again.`,
          };
        }
        return {
          success: false,
          error: `Nonce mismatch. Expected ${expectedNonce}, got ${currentNonce}. Could not sync with contract. Please refresh page and try again.`,
        };
      }
    }

    // Re-check network one more time before contract interaction
    const finalNetworkCheck = await checkNetwork(provider);
    if (!finalNetworkCheck.correct) {
      return {
        success: false,
        error: `Wrong network. Expected Base (${CONTRACT_CHAIN_ID}), got ${finalNetworkCheck.chainId || 'unknown'}. Please switch to Base network.`,
      };
    }

    // Get contract with signer
    const signer = await provider.getSigner();
    const contract = await getContractWithSigner(signer);

    // Check that contract exists
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === '0x' || code === '0x0') {
      // Get current network info for better error message
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      
      return {
        success: false,
        error: `Contract not found at address ${CONTRACT_ADDRESS} on network ${currentChainId}. Expected network: ${CONTRACT_CHAIN_ID} (Base). Please verify you're on the correct network and that the contract is deployed.`,
      };
    }

    // Log parameters for debugging
    console.log('Submitting transaction:', {
      deltaWins,
      deltaLosses,
      expectedNonce,
      contractAddress: CONTRACT_ADDRESS,
    });

    // Estimate gas before submission
    let gasEstimate;
    try {
      gasEstimate = await contract.submitStatsSnapshot.estimateGas(
        deltaWins,
        deltaLosses,
        expectedNonce
      );
      console.log('Gas estimate:', gasEstimate.toString());
    } catch (estimateError: any) {
      console.error('Gas estimation error:', estimateError);
      // If estimation failed, use default value
      gasEstimate = BigInt(100000);
    }

    // Send transaction
    // Note: If wallet shows "Preview unavailable",
    // this usually means contract is not verified on BaseScan
    // or wallet can't get ABI. Transaction should still work.
    const tx = await contract.submitStatsSnapshot(
      deltaWins,
      deltaLosses,
      expectedNonce,
      {
        gasLimit: gasEstimate + (gasEstimate / BigInt(5)), // Add 20% buffer
      }
    );

    // Save transaction hash immediately
    const txHash = tx.hash;
    if (!txHash) {
      return {
        success: false,
        error: 'Failed to get transaction hash',
      };
    }

    // Wait for confirmation (up to 3 blocks for reliability)
    let receipt;
    try {
      receipt = await tx.wait(3); // Wait for 3 confirmations
    } catch (waitError: any) {
      // If transaction was sent but error occurred while waiting,
      // still save hash so user can check transaction
      console.error('Confirmation wait error:', waitError);
      
      // Check if transaction was executed (revert)
      if (waitError.receipt) {
        // Transaction was included in block but reverted
        return {
          success: false,
          error: 'Transaction rejected by contract. Check transaction in blockchain.',
        };
      }
      
      // Transaction sent but not yet confirmed
      // Save hash so user can check status later
      const newLastSubmitted: LastSubmitted = {
        games: localStats.totalGames,
        wins: localStats.wins,
        losses: localStats.losses,
        nonce: expectedNonce + 1,
        txHash: txHash,
        timestamp: Date.now(),
      };
      saveLastSubmitted(newLastSubmitted, fid);

      return {
        success: false,
        error: `Transaction sent but not confirmed. Hash: ${txHash.slice(0, 10)}... Check status later.`,
      };
    }

    // Check transaction status
    if (receipt && receipt.status === 1 && receipt.hash) {
      // Transaction successfully confirmed
      console.log('Transaction successfully confirmed:', receipt.hash);
      
      // Check that nonce actually increased
      const newNonce = await getCurrentNonce(walletAddress, provider);
      console.log('Nonce after transaction:', newNonce, 'Expected:', expectedNonce + 1);
      
      if (newNonce !== expectedNonce + 1) {
        console.warn('Nonce did not increase after transaction. Expected:', expectedNonce + 1, 'Got:', newNonce);
        // Wait a bit and check again (may be delay)
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryNonce = await getCurrentNonce(walletAddress, provider);
        console.log('Nonce after retry check:', retryNonce);
      }

      // Check that data was actually written to contract
      const onchainStats = await getOnchainStats(walletAddress, provider);
      if (onchainStats) {
        console.log('Stats in contract after transaction:', onchainStats);
        console.log('Local stats:', localStats);
      }

      const newLastSubmitted: LastSubmitted = {
        games: localStats.totalGames,
        wins: localStats.wins,
        losses: localStats.losses,
        nonce: expectedNonce + 1,
        txHash: receipt.hash,
        timestamp: Date.now(),
      };
      saveLastSubmitted(newLastSubmitted, fid);

      return {
        success: true,
        txHash: receipt.hash,
      };
    } else if (receipt && receipt.status === 0) {
      // Transaction was included in block but reverted
      console.error('Transaction revert:', receipt);
      
      // Try to get revert reason from logs
      let revertReason = 'Unknown reason';
      if (receipt.logs && receipt.logs.length > 0) {
        revertReason = 'Check transaction logs in blockchain';
      }
      
      return {
        success: false,
        error: `Transaction rejected by contract (revert). ${revertReason}`,
        txHash: receipt.hash,
      };
    }

    return {
      success: false,
      error: 'Transaction was not confirmed',
    };
  } catch (error: any) {
    console.error('Error submitting statistics:', error);

    // Parse common errors
    const errorMessage = error?.message || error?.error?.message || String(error);
    const errorCode = error?.code || error?.error?.code;

    // Handle contract errors
    if (errorMessage?.includes('INVALID_NONCE')) {
      return {
        success: false,
        error: 'Invalid nonce. Refresh page and try again.',
      };
    }
    if (errorMessage?.includes('NOTHING_TO_SUBMIT')) {
      return { success: false, error: 'Nothing to submit' };
    }
    if (errorMessage?.includes('BATCH_TOO_LARGE')) {
      return {
        success: false,
        error: 'Batch too large (maximum 200 games)',
      };
    }

    // Handle wallet errors
    if (errorCode === 4001 || errorCode === 'ACTION_REJECTED' || errorMessage?.includes('User rejected')) {
      return {
        success: false,
        error: 'Transaction rejected by user',
      };
    }

    // Handle network errors
    if (errorCode === -32603 || errorMessage?.includes('network') || errorMessage?.includes('Network')) {
      return {
        success: false,
        error: 'Network error. Check connection and try again.',
      };
    }

    // Handle insufficient gas errors
    if (errorMessage?.includes('insufficient funds') || errorMessage?.includes('gas') || errorCode === -32000) {
      return {
        success: false,
        error: 'Insufficient funds to pay for gas. Make sure wallet has ETH.',
      };
    }

    // Handle contract errors (revert)
    if (errorMessage?.includes('revert') || errorMessage?.includes('execution reverted')) {
      const revertReason = errorMessage.match(/revert\s+(.+)/i)?.[1] || '';
      if (revertReason.includes('INVALID_NONCE')) {
        return {
          success: false,
          error: 'Invalid nonce. Refresh page and try again.',
        };
      }
      return {
        success: false,
        error: `Contract error: ${revertReason || 'Transaction rejected by contract'}`,
      };
    }

    // Remove addresses from error message
    let cleanError = errorMessage;
    if (cleanError) {
      // Remove addresses (0x...)
      cleanError = cleanError.replace(/0x[a-fA-F0-9]{40}/g, '[address]');
      // Remove long hashes
      cleanError = cleanError.replace(/0x[a-fA-F0-9]{64}/g, '[hash]');
    }

    return {
      success: false,
      error: cleanError || 'An error occurred while sending transaction. Please try again.',
    };
  }
}

/**
 * Get RPC URL for the contract network
 */
function getRpcUrl(): string {
  return CONTRACT_CHAIN_ID === 8453
    ? 'https://mainnet.base.org'
    : 'https://sepolia.base.org';
}

/**
 * Get statistics from blockchain using public RPC (no wallet required)
 */
export async function getOnchainStatsPublic(
  playerAddress: string
): Promise<{
  totalGames: number;
  wins: number;
  losses: number;
  winPercentage: number;
  lastUpdated: number;
  nonce: number;
} | null> {
  try {
    console.log('getOnchainStatsPublic: Fetching stats for address:', playerAddress);
    
    const rpcUrl = getRpcUrl();
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    console.log('getOnchainStatsPublic: Contract obtained, calling getStats for:', playerAddress);
    
    const stats = await contract.getStats(playerAddress);
    console.log('getOnchainStatsPublic: Raw stats from contract:', stats);
    
    const winPercentage = await contract.getWinPercentage(playerAddress);
    console.log('getOnchainStatsPublic: Win percentage:', winPercentage);

    const result = {
      totalGames: Number(stats.totalGames),
      wins: Number(stats.wins),
      losses: Number(stats.losses),
      winPercentage: Number(winPercentage) / 100, // Convert from 10000 = 100%
      lastUpdated: Number(stats.lastUpdated),
      nonce: Number(stats.nonce),
    };
    
    console.log('getOnchainStatsPublic: Processed stats:', result);
    return result;
  } catch (error: any) {
    console.error('getOnchainStatsPublic: Error getting statistics from blockchain:', error);
    console.error('getOnchainStatsPublic: Error message:', error?.message);
    console.error('getOnchainStatsPublic: Error code:', error?.code);
    console.error('getOnchainStatsPublic: Error details:', error);
    return null;
  }
}

/**
 * Get statistics from blockchain
 */
export async function getOnchainStats(
  playerAddress: string,
  provider: BrowserProvider
): Promise<{
  totalGames: number;
  wins: number;
  losses: number;
  winPercentage: number;
  lastUpdated: number;
  nonce: number;
} | null> {
  try {
    console.log('getOnchainStats: Fetching stats for address:', playerAddress);
    
    // Check network first
    const networkCheck = await checkNetwork(provider);
    if (!networkCheck.correct) {
      console.warn('getOnchainStats: Wrong network for loading stats:', networkCheck.error);
      console.warn('getOnchainStats: Expected network:', CONTRACT_CHAIN_ID, 'Got:', networkCheck.chainId);
      return null;
    }

    console.log('getOnchainStats: Network check passed, getting contract...');
    const contract = await getContract(provider);
    console.log('getOnchainStats: Contract obtained, calling getStats for:', playerAddress);
    
    const stats = await contract.getStats(playerAddress);
    console.log('getOnchainStats: Raw stats from contract:', stats);
    
    const winPercentage = await contract.getWinPercentage(playerAddress);
    console.log('getOnchainStats: Win percentage:', winPercentage);

    const result = {
      totalGames: Number(stats.totalGames),
      wins: Number(stats.wins),
      losses: Number(stats.losses),
      winPercentage: Number(winPercentage) / 100, // Convert from 10000 = 100%
      lastUpdated: Number(stats.lastUpdated),
      nonce: Number(stats.nonce),
    };
    
    console.log('getOnchainStats: Processed stats:', result);
    return result;
  } catch (error: any) {
    console.error('getOnchainStats: Error getting statistics from blockchain:', error);
    console.error('getOnchainStats: Error message:', error?.message);
    console.error('getOnchainStats: Error code:', error?.code);
    console.error('getOnchainStats: Error details:', error);
    return null;
  }
}
