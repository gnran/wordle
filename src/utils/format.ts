/**
 * Форматирует адрес кошелька в формате 0xXXXX...XXXX
 * @param address - Полный адрес кошелька
 * @param startLength - Количество символов в начале (по умолчанию 6)
 * @param endLength - Количество символов в конце (по умолчанию 4)
 * @returns Отформатированный адрес
 */
export function formatWalletAddress(
  address: string,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address || address.length < startLength + endLength) {
    return address;
  }
  
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}
