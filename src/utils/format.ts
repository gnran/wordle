/**
 * Formats wallet address in format 0xXXXX...XXXX
 * @param address - Full wallet address
 * @param startLength - Number of characters at start (default 6)
 * @param endLength - Number of characters at end (default 4)
 * @returns Formatted address
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
