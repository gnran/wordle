import { useState, useEffect, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { GameState, UserStats, Letter, LetterState, UserInfo } from './types';
import { getRandomWord, isValidWord } from './data/words';
import { evaluateGuess, wordToLetters } from './utils/gameLogic';
import { saveGameState, loadGameState, saveStats, loadStats, saveLastPlayedDate, resetStats, clearGameState } from './utils/storage';
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
 * Главный компонент приложения Wordle
 */
function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Пытаемся загрузить сохраненное состояние
    const saved = loadGameState();
    if (saved && saved.gameStatus === 'playing') {
      return saved;
    }
    // Создаем новую игру
    return {
      targetWord: getRandomWord(),
      currentGuess: '',
      guesses: [],
      gameStatus: 'playing',
      currentRow: 0
    };
  });

  const [stats, setStats] = useState<UserStats>(loadStats);
  const [showStats, setShowStats] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('wordle-theme');
    if (saved) {
      return saved === 'dark';
    }
    return true; // По умолчанию темная тема
  });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Уведомляем SDK о готовности приложения
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  // Получаем данные пользователя из Context API и Wallet
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const context = await sdk.context;
        const user = context.user;
        
        let walletAddress: string | undefined;
        try {
          const provider = await sdk.wallet.getEthereumProvider();
          if (provider) {
            // Сначала пытаемся получить уже подключенные аккаунты (без запроса разрешения)
            let accounts = await provider.request({ method: 'eth_accounts' });
            
            // Если аккаунтов нет, пытаемся запросить (может показать промпт пользователю)
            if (!accounts || accounts.length === 0) {
              try {
                accounts = await provider.request({ method: 'eth_requestAccounts' });
              } catch (requestError) {
                // Пользователь может отклонить запрос - это нормально
                console.log('Пользователь не предоставил доступ к кошельку');
              }
            }
            
            if (accounts && accounts.length > 0) {
              walletAddress = accounts[0];
            }
          }
        } catch (error) {
          console.warn('Не удалось получить адрес кошелька:', error);
        }

        setUserInfo({
          fid: user.fid,
          username: user.username,
          displayName: user.displayName,
          pfpUrl: user.pfpUrl,
          walletAddress
        });
      } catch (error) {
        console.error('Ошибка получения данных пользователя:', error);
      }
    }

    fetchUserInfo();
  }, []);

  // Применяем тему при загрузке и изменении
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('wordle-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('wordle-theme', 'light');
    }
  }, [isDarkMode]);
  
  // Сохраняем состояние игры при изменении
  useEffect(() => {
    if (gameState.gameStatus === 'playing') {
      saveGameState(gameState);
    }
  }, [gameState]);

  /**
   * Создает массив строк для отображения на игровом поле
   */
  const getDisplayRows = (): Letter[][] => {
    const rows: Letter[][] = [];
    
    // Добавляем уже угаданные строки
    gameState.guesses.forEach((guess) => {
      const states = evaluateGuess(guess, gameState.targetWord);
      rows.push(wordToLetters(guess, states));
    });

    // Добавляем текущую строку только если игра еще идет
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

    // Заполняем оставшиеся строки пустыми буквами
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
   * Получает состояния букв для клавиатуры
   */
  const getLetterStates = (): Record<string, LetterState> => {
    const states: Record<string, LetterState> = {};
    
    gameState.guesses.forEach((guess) => {
      const evaluated = evaluateGuess(guess, gameState.targetWord);
      guess.split('').forEach((letter, index) => {
        const currentState = states[letter];
        const newState = evaluated[index];
        
        // Приоритет: correct > present > absent
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
   * Обработка нажатия клавиши
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
   * Обработка удаления символа
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
   * Обработка отправки предположения
   */
  const handleEnter = useCallback(() => {
    if (gameState.gameStatus !== 'playing') return;
    
    const guess = gameState.currentGuess.toUpperCase();
    
    // Проверка длины
    if (guess.length !== WORD_LENGTH) {
      setErrorMessage('Слово должно содержать 5 букв');
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }

    // Проверка валидности слова
    if (!isValidWord(guess)) {
      setErrorMessage('Слово не найдено в словаре');
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

    // Обновляем статистику, если игра окончена
    if (newGameStatus !== 'playing') {
      updateStats(newGameStatus === 'won');
      setShowGameOver(true);
      saveLastPlayedDate();
      clearGameState(); // Очищаем сохраненное состояние, чтобы при обновлении страницы начиналась новая игра
    }
  }, [gameState]);

  /**
   * Обновление статистики пользователя
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

      saveStats(newStats);
      return newStats;
    });
  };

  /**
   * Начать новую игру
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
   * Сброс статистики
   */
  const handleResetStats = () => {
    if (window.confirm('Вы уверены, что хотите сбросить всю статистику?')) {
      resetStats();
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
   * Обработка физической клавиатуры
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showStats || showGameOver) return;

      // Игнорируем комбинации с модификаторами (Ctrl, Alt, Shift, Meta)
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      const key = e.key.toUpperCase();
      
      // Английские буквы
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
    // Прокрутка наверх или обновление страницы
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
              Угадай слово за 6 попыток
            </p>
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
              letterStates={letterStates}
            />
            
            <div className="flex gap-2 justify-center mt-4 sm:mt-6 px-2">
              <button
                onClick={handleEnter}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors text-sm sm:text-base"
              >
                ENTER
              </button>
              <button
                onClick={handleNewGame}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors text-sm sm:text-base"
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
