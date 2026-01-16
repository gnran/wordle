/**
 * Loading screen component displayed while wallet connection is being established
 */
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-blue-500 border-r-transparent"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Connecting Wallet...
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please wait while we connect your wallet
        </p>
      </div>
    </div>
  );
}
