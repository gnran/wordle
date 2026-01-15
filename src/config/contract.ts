/**
 * Конфигурация смарт-контракта WordleStatsSnapshot
 * 
 * ВАЖНО: После развертывания контракта обновите CONTRACT_ADDRESS
 * и CONTRACT_CHAIN_ID в соответствии с вашей сетью
 */

// Base Mainnet: 8453
// Base Sepolia (testnet): 84532
export const CONTRACT_CHAIN_ID = 8453; // Base Mainnet

// Адрес развернутого контракта
export const CONTRACT_ADDRESS = "0xA69227c3A004B99871050EA175aCcC2dF77c204f";

// ABI контракта
export const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "MAX_BATCH_GAMES",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getNonce",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getStats",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "totalGames",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "wins",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "losses",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "lastUpdated",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "nonce",
            "type": "uint64"
          }
        ],
        "internalType": "struct WordleStatsSnapshot.PlayerStats",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getWinPercentage",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "deltaWins",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "deltaLosses",
        "type": "uint256"
      },
      {
        "internalType": "uint64",
        "name": "expectedNonce",
        "type": "uint64"
      }
    ],
    "name": "submitStatsSnapshot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "deltaGames",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "deltaWins",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "deltaLosses",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "nonce",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "timestamp",
        "type": "uint64"
      }
    ],
    "name": "StatsSnapshotSubmitted",
    "type": "event"
  }
] as const;
