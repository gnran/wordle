/**
 * WordleStatsSnapshot smart contract configuration
 * 
 * IMPORTANT: After deploying contract, update CONTRACT_ADDRESS
 * and CONTRACT_CHAIN_ID according to your network
 */

// Base Mainnet: 8453
// Base Sepolia (testnet): 84532
export const CONTRACT_CHAIN_ID = 8453; // Base Mainnet

// Deployed contract address
export const CONTRACT_ADDRESS = "0xBF0a43607795260B609e6E36d0fD526b3f112628";

// Contract ABI
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
