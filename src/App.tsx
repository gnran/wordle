import { useState, useEffect, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { GameState, UserStats, Letter, LetterState, UserInfo } from './types';
import { getRandomWord, isValidWord } from './data/words';
import { evaluateGuess, wordToLetters } from './utils/gameLogic';
import { saveGameState, loadGameState, saveStats, loadStats, saveLastPlayedDate, resetStats, clearGameState, migrateLegacyStats } from './utils/storage';
import { GameBoard } from './components/GameBoard';
import { Keyboard } from './components/Keyboard';
import { StatsModal } from './components/StatsModal';
import { GameOverModal } from './components/GameOverModal';
import { Navigation } from './components/Navigation';
import { LeaderboardModal } from './components/LeaderboardModal';
import { FAQModal } from './components/FAQModal';
import { ProfileModal } from './components/ProfileModal';


const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

/**
 * Main Wordle application component
 */
function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Create a new game initially - will load saved state when FID is available
    return {
      targetWord: getRandomWord(),
      currentGuess: '',
      guesses: [],
      gameStatus: 'playing',
      currentRow: 0
    };
  });

  const [stats, setStats] = useState<UserStats>(() => ({
    totalGames: 0,
    wins: 0,
    losses: 0,
    winPercentage: 0,
    currentStreak: 0,
    maxStreak: 0
  }));
  const [showStats, setShowStats] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('wordle-theme');
    if (saved) {
      return saved === 'dark';
    }
    return true; // Dark theme by default
  });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Notify SDK that app is ready
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  // Get user data from Context API and Wallet
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const context = await sdk.context;
        const user = context.user;
        
        let walletAddress: string | undefined;
        try {
          const provider = await sdk.wallet.getEthereumProvider();
          if (provider) {
            // First try to get already connected accounts (without requesting permission)
            let accounts = await provider.request({ method: 'eth_accounts' });
            
            // If no accounts, try to request (may show user prompt)
            if (!accounts || accounts.length === 0) {
              try {
                accounts = await provider.request({ method: 'eth_requestAccounts' });
              } catch (requestError) {
                // User may reject the request - this is normal
                console.log('User did not provide wallet access');
              }
            }
            
            if (accounts && accounts.length > 0) {
              walletAddress = accounts[0];
            }
          }
        } catch (error) {
          console.warn('Failed to get wallet address:', error);
        }

        const newUserInfo = {
          fid: user.fid,
          username: user.username,
          displayName: user.displayName,
          pfpUrl: user.pfpUrl,
          walletAddress
        };

        setUserInfo(newUserInfo);

        // Migrate legacy stats if they exist
        migrateLegacyStats(user.fid);

        // Load stats and game state for this FID
        const userStats = loadStats(user.fid);
        setStats(userStats);

        // Load saved game state for this FID
        const savedGameState = loadGameState(user.fid);
        if (savedGameState && savedGameState.gameStatus === 'playing') {
          setGameState(savedGameState);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If user is not logged in, use null FID for temporary storage
        setUserInfo(null);
      }
    }

    fetchUserInfo();
  }, []);

  // Apply theme on load and change
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('wordle-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('wordle-theme', 'light');
    }
  }, [isDarkMode]);
  
  // Save game state on change
  useEffect(() => {
    if (gameState.gameStatus === 'playing') {
      saveGameState(gameState, userInfo?.fid ?? null);
    }
  }, [gameState, userInfo?.fid]);

  /**
   * Creates array of rows for display on game board
   */
  const getDisplayRows = (): Letter[][] => {
    const rows: Letter[][] = [];
    
    // Add already guessed rows
    gameState.guesses.forEach((guess) => {
      const states = evaluateGuess(guess, gameState.targetWord);
      rows.push(wordToLetters(guess, states));
    });

    // Add current row only if game is still playing
    if (gameState.gameStatus === 'playing') {
      const currentRowLetters: Letter[] = [];
      for (let i = 0; i < WORD_LENGTH; i++) {
        currentRowLetters.push({
          value: gameState.currentGuess[i] || '',
          state: 'empty'
        });
      }
      rows.push(currentRowLetters);
    }

    // Fill remaining rows with empty letters
    while (rows.length < MAX_ATTEMPTS) {
      rows.push(
        Array(WORD_LENGTH).fill(null).map(() => ({
          value: '',
          state: 'empty' as LetterState
        }))
      );
    }

    return rows;
  };

  /**
   * Gets letter states for keyboard
   */
  const getLetterStates = (): Record<string, LetterState> => {
    const states: Record<string, LetterState> = {};
    
    gameState.guesses.forEach((guess) => {
      const evaluated = evaluateGuess(guess, gameState.targetWord);
      guess.split('').forEach((letter, index) => {
        const currentState = states[letter];
        const newState = evaluated[index];
        
        // Priority: correct > present > absent
        if (!currentState || currentState === 'empty' || 
            (currentState === 'absent' && newState !== 'absent') ||
            (currentState === 'present' && newState === 'correct')) {
          states[letter] = newState;
        }
      });
    });

    return states;
  };

  /**
   * Handle key press
   */
  const handleKeyPress = useCallback((key: string) => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentGuess.length < WORD_LENGTH) {
      setGameState(prev => ({
        ...prev,
        currentGuess: prev.currentGuess + key.toUpperCase()
      }));
      setErrorMessage('');
    }
  }, [gameState.gameStatus, gameState.currentGuess.length]);

  /**
   * Handle character deletion
   */
  const handleDelete = useCallback(() => {
    if (gameState.gameStatus !== 'playing') return;
    setGameState(prev => ({
      ...prev,
      currentGuess: prev.currentGuess.slice(0, -1)
    }));
    setErrorMessage('');
  }, [gameState.gameStatus]);

  /**
   * Handle guess submission
   */
  const handleEnter = useCallback(() => {
    if (gameState.gameStatus !== 'playing') return;
    
    const guess = gameState.currentGuess.toUpperCase();
    
    // Length check
    if (guess.length !== WORD_LENGTH) {
      setErrorMessage('Word must contain 5 letters');
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }

    // Word validity check
    if (!isValidWord(guess)) {
      setErrorMessage('Word not found in dictionary');
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }

    const newGuesses = [...gameState.guesses, guess];
    const isCorrect = guess === gameState.targetWord;
    const isLastAttempt = newGuesses.length >= MAX_ATTEMPTS;

    let newGameStatus: 'playing' | 'won' | 'lost' = 'playing';
    if (isCorrect) {
      newGameStatus = 'won';
    } else if (isLastAttempt) {
      newGameStatus = 'lost';
    }

    const newGameState: GameState = {
      ...gameState,
      guesses: newGuesses,
      currentGuess: '',
      currentRow: newGuesses.length,
      gameStatus: newGameStatus
    };

    setGameState(newGameState);

    // Update stats if game is over
    if (newGameStatus !== 'playing') {
      updateStats(newGameStatus === 'won');
      setShowGameOver(true);
      saveLastPlayedDate(userInfo?.fid ?? null);
      clearGameState(userInfo?.fid ?? null); // Clear saved state so a new game starts on page refresh
    }
  }, [gameState]);

  /**
   * Update user statistics
   */
  const updateStats = (won: boolean) => {
    setStats(prev => {
      const newStats: UserStats = {
        totalGames: prev.totalGames + 1,
        wins: won ? prev.wins + 1 : prev.wins,
        losses: won ? prev.losses : prev.losses + 1,
        winPercentage: 0,
        currentStreak: won ? prev.currentStreak + 1 : 0,
        maxStreak: won ? Math.max(prev.maxStreak, prev.currentStreak + 1) : prev.maxStreak
      };
      
      newStats.winPercentage = newStats.totalGames > 0
        ? (newStats.wins / newStats.totalGames) * 100
        : 0;

      saveStats(newStats, userInfo?.fid ?? null);
      return newStats;
    });
  };

  /**
   * Start a new game
   */
  const handleNewGame = () => {
    const newGameState: GameState = {
      targetWord: getRandomWord(),
      currentGuess: '',
      guesses: [],
      gameStatus: 'playing',
      currentRow: 0
    };
    setGameState(newGameState);
    setShowGameOver(false);
    setErrorMessage('');
  };

  /**
   * Reset statistics
   */
  const handleResetStats = () => {
    if (window.confirm('Are you sure you want to reset all statistics?')) {
      resetStats(userInfo?.fid ?? null);
      setStats({
        totalGames: 0,
        wins: 0,
        losses: 0,
        winPercentage: 0,
        currentStreak: 0,
        maxStreak: 0
      });
    }
  };

  /**
   * Handle physical keyboard
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showStats || showGameOver) return;

      // Ignore modifier key combinations (Ctrl, Alt, Shift, Meta)
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      const key = e.key.toUpperCase();
      
      // English letters
      if (/[A-Z]/.test(key) && key.length === 1) {
        handleKeyPress(key);
      } else if (key === 'BACKSPACE' || key === 'DELETE') {
        handleDelete();
      } else if (key === 'ENTER') {
        handleEnter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, showStats, showGameOver, handleKeyPress, handleDelete, handleEnter]);

  const displayRows = getDisplayRows();
  const letterStates = getLetterStates();

  const handleThemeToggle = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleHomeClick = () => {
    // Scroll to top or refresh page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navigation
        onHomeClick={handleHomeClick}
        onLeaderboardClick={() => setShowLeaderboard(true)}
        onFAQClick={() => setShowFAQ(true)}
        onProfileClick={() => setShowProfile(true)}
        isDarkMode={isDarkMode}
        onThemeToggle={handleThemeToggle}
      />

      <main className="flex-1 flex flex-col items-center py-2 px-4">
        <div className="w-full max-w-2xl">
          <header className="text-center mb-2 sm:mb-3">
            <h1 className="text-lg sm:text-xl font-bold text-blue-500 dark:text-blue-400 mb-1">
              WORDLY
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Guess the word in 6 attempts
            </p>
            {!userInfo && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                ⚠️ Statistics are stored temporarily. Log in to sync across devices.
              </p>
            )}
          </header>

          {errorMessage && (
            <div className="bg-red-600 text-white px-4 py-2 rounded mb-4 animate-pulse text-center">
              {errorMessage}
            </div>
          )}

          <GameBoard
            rows={displayRows}
            currentRow={gameState.currentRow}
            currentGuess={gameState.currentGuess}
          />

          <div className="w-full mt-4 sm:mt-6">
            <Keyboard
              onKeyPress={handleKeyPress}
              onDelete={handleDelete}
              onEnter={handleEnter}
              letterStates={letterStates}
            />
            
            <div className="flex gap-2 justify-center mt-4 sm:mt-6 px-2">
              <button
                onClick={handleNewGame}
                className="bg-blue-900 hover:bg-blue-800 border border-gray-600 dark:border-gray-500 text-gray-200 font-semibold py-2 px-4 rounded transition-colors text-sm sm:text-base"
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      </main>

      <StatsModal
        stats={stats}
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        onReset={handleResetStats}
      />

      <GameOverModal
        isOpen={showGameOver}
        won={gameState.gameStatus === 'won'}
        targetWord={gameState.targetWord}
        attempts={gameState.guesses.length}
        onClose={() => setShowGameOver(false)}
        onNewGame={handleNewGame}
      />

      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      <FAQModal
        isOpen={showFAQ}
        onClose={() => setShowFAQ(false)}
      />

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        stats={stats}
        userInfo={userInfo}
      />
    </div>
  );
}

export default App;
