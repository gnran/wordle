import { BrowserProvider, Contract, Signer } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, CONTRACT_CHAIN_ID } from '../config/contract';
import { UserStats, LastSubmitted } from '../types';
import { loadLastSubmitted, saveLastSubmitted } from './storage';

/**
 * Вычислить дельту между локальной статистикой и последней отправленной
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
 * Валидация дельты перед отправкой
 */
export function validateDelta(
  deltaWins: number,
  deltaLosses: number
): { valid: boolean; error?: string } {
  if (deltaWins < 0 || deltaLosses < 0) {
    return {
      valid: false,
      error: 'Дельта не может быть отрицательной',
    };
  }

  const deltaGames = deltaWins + deltaLosses;

  if (deltaGames === 0) {
    return {
      valid: false,
      error: 'Нечего отправлять',
    };
  }

  if (deltaGames > 200) {
    return {
      valid: false,
      error: 'Слишком большой батч (максимум 200 игр)',
    };
  }

  return { valid: true };
}

/**
 * Получить экземпляр контракта
 */
export async function getContract(provider: BrowserProvider): Promise<Contract> {
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

/**
 * Получить экземпляр контракта с подписантом (для транзакций)
 */
export async function getContractWithSigner(signer: Signer): Promise<Contract> {
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Проверить подключение к правильной сети
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
        error: `Неправильная сеть. Ожидается Base (${CONTRACT_CHAIN_ID}), получена ${chainId}`,
      };
    }

    return { correct: true, chainId };
  } catch (error: any) {
    return {
      correct: false,
      error: error.message || 'Ошибка проверки сети',
    };
  }
}

/**
 * Переключиться на сеть Base
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
    // Цепочка не добавлена, попробуем добавить
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
          error: `Не удалось добавить сеть: ${addError.message}`,
        };
      }
    }
    return {
      success: false,
      error: `Не удалось переключить сеть: ${error.message}`,
    };
  }
}

/**
 * Получить текущий nonce из контракта
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
    console.error('Ошибка получения nonce:', error);
    return 0;
  }
}

/**
 * Отправить статистику в блокчейн
 */
export async function submitStatsOnchain(
  localStats: UserStats,
  walletAddress: string,
  provider: BrowserProvider
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> {
  try {
    // Проверка сети
    const networkCheck = await checkNetwork(provider);
    if (!networkCheck.correct) {
      const switchResult = await switchToBaseNetwork(provider);
      if (!switchResult.success) {
        return {
          success: false,
          error: networkCheck.error || switchResult.error,
        };
      }
      // Повторная проверка после переключения
      const recheck = await checkNetwork(provider);
      if (!recheck.correct) {
        return {
          success: false,
          error: 'Не удалось переключиться на правильную сеть',
        };
      }
    }

    // Загружаем последнюю отправленную статистику
    const lastSubmitted = loadLastSubmitted();

    // Вычисляем дельту
    const { deltaWins, deltaLosses, expectedNonce } = calculateDelta(
      localStats,
      lastSubmitted
    );

    // Валидация дельты
    const validation = validateDelta(deltaWins, deltaLosses);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Получаем текущий nonce из контракта для проверки
    const currentNonce = await getCurrentNonce(walletAddress, provider);
    if (currentNonce !== expectedNonce) {
      return {
        success: false,
        error: `Несоответствие nonce. Ожидается ${expectedNonce}, получено ${currentNonce}. Обновите страницу и попробуйте снова.`,
      };
    }

    // Получаем контракт с подписантом
    const signer = await provider.getSigner();
    const contract = await getContractWithSigner(signer);

    // Проверяем, что контракт существует
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === '0x' || code === '0x0') {
      return {
        success: false,
        error: 'Контракт не найден по указанному адресу. Проверьте конфигурацию.',
      };
    }

    // Отправляем транзакцию
    const tx = await contract.submitStatsSnapshot(
      deltaWins,
      deltaLosses,
      expectedNonce
    );

    // Ждем подтверждения
    const receipt = await tx.wait();

    if (receipt && receipt.hash) {
      // Обновляем lastSubmitted
      const newLastSubmitted: LastSubmitted = {
        games: localStats.totalGames,
        wins: localStats.wins,
        losses: localStats.losses,
        nonce: expectedNonce + 1,
        txHash: receipt.hash,
        timestamp: Date.now(),
      };
      saveLastSubmitted(newLastSubmitted);

      return {
        success: true,
        txHash: receipt.hash,
      };
    }

    return {
      success: false,
      error: 'Транзакция не была подтверждена',
    };
  } catch (error: any) {
    console.error('Ошибка отправки статистики:', error);

    // Парсим распространенные ошибки
    const errorMessage = error?.message || error?.error?.message || String(error);
    const errorCode = error?.code || error?.error?.code;

    // Обработка ошибок от контракта
    if (errorMessage?.includes('INVALID_NONCE')) {
      return {
        success: false,
        error: 'Неверный nonce. Обновите страницу и попробуйте снова.',
      };
    }
    if (errorMessage?.includes('NOTHING_TO_SUBMIT')) {
      return { success: false, error: 'Нечего отправлять' };
    }
    if (errorMessage?.includes('BATCH_TOO_LARGE')) {
      return {
        success: false,
        error: 'Слишком большой батч (максимум 200 игр)',
      };
    }

    // Обработка ошибок от кошелька
    if (errorCode === 4001 || errorCode === 'ACTION_REJECTED' || errorMessage?.includes('User rejected')) {
      return {
        success: false,
        error: 'Транзакция отклонена пользователем',
      };
    }

    // Обработка ошибок сети
    if (errorCode === -32603 || errorMessage?.includes('network') || errorMessage?.includes('Network')) {
      return {
        success: false,
        error: 'Ошибка сети. Проверьте подключение и попробуйте снова.',
      };
    }

    // Обработка ошибок недостатка газа
    if (errorMessage?.includes('insufficient funds') || errorMessage?.includes('gas') || errorCode === -32000) {
      return {
        success: false,
        error: 'Недостаточно средств для оплаты газа. Убедитесь, что на кошельке есть ETH.',
      };
    }

    // Обработка ошибок контракта (revert)
    if (errorMessage?.includes('revert') || errorMessage?.includes('execution reverted')) {
      const revertReason = errorMessage.match(/revert\s+(.+)/i)?.[1] || '';
      if (revertReason.includes('INVALID_NONCE')) {
        return {
          success: false,
          error: 'Неверный nonce. Обновите страницу и попробуйте снова.',
        };
      }
      return {
        success: false,
        error: `Ошибка контракта: ${revertReason || 'Транзакция отклонена контрактом'}`,
      };
    }

    // Убираем адреса из сообщения об ошибке
    let cleanError = errorMessage;
    if (cleanError) {
      // Удаляем адреса (0x...)
      cleanError = cleanError.replace(/0x[a-fA-F0-9]{40}/g, '[адрес]');
      // Удаляем длинные хеши
      cleanError = cleanError.replace(/0x[a-fA-F0-9]{64}/g, '[хеш]');
    }

    return {
      success: false,
      error: cleanError || 'Произошла ошибка при отправке транзакции. Попробуйте снова.',
    };
  }
}

/**
 * Получить статистику из блокчейна
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
    const contract = await getContract(provider);
    const stats = await contract.getStats(playerAddress);
    const winPercentage = await contract.getWinPercentage(playerAddress);

    return {
      totalGames: Number(stats.totalGames),
      wins: Number(stats.wins),
      losses: Number(stats.losses),
      winPercentage: Number(winPercentage) / 100, // Конвертируем из 10000 = 100%
      lastUpdated: Number(stats.lastUpdated),
      nonce: Number(stats.nonce),
    };
  } catch (error) {
    console.error('Ошибка получения статистики из блокчейна:', error);
    return null;
  }
}
