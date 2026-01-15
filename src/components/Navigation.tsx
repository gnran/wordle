interface NavigationProps {
  onHomeClick: () => void;
  onLeaderboardClick: () => void;
  onFAQClick: () => void;
  onProfileClick: () => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

/**
 * Компонент навигационного меню
 */
export const Navigation = ({
  onHomeClick,
  onLeaderboardClick,
  onFAQClick,
  onProfileClick,
  isDarkMode,
  onThemeToggle
}: NavigationProps) => {
  return (
    <nav className="w-full bg-gray-800 dark:bg-gray-900 border-b border-gray-700 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left side - Home and Leaderboard */}
          <div className="flex items-center gap-4">
            <button
              onClick={onHomeClick}
              className="p-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors"
              title="Главная"
            >
              <svg className="w-5 h-5 text-gray-300 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            
            <button
              onClick={onLeaderboardClick}
              className="p-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors relative"
              title="Лидерборд"
            >
              <svg className="w-5 h-5 text-gray-300 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </button>
          </div>

          {/* Center - Theme Toggle */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-300 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <button
              onClick={onThemeToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-gray-600' : 'bg-orange-500'
              }`}
              title={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              >
                {isDarkMode && (
                  <svg className="w-3 h-3 text-gray-800 mt-0.5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </span>
            </button>
          </div>

          {/* Right side - FAQ and Profile */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-px bg-gray-600 dark:bg-gray-700"></div>
            
            <button
              onClick={onFAQClick}
              className="p-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors"
              title="FAQ"
            >
              <svg className="w-5 h-5 text-gray-300 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <div className="h-6 w-px bg-gray-600 dark:bg-gray-700"></div>

            <button
              onClick={onProfileClick}
              className="p-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors"
              title="Профиль"
            >
              <svg className="w-5 h-5 text-gray-300 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
