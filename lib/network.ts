import { useChainId, useConnection } from 'wagmi';

/**
 * True when a wallet is connected but sits on a different network from the one this app is
 * configured for (Base Sepolia, set in lib/wagmi.ts).
 *
 * `useChainId()` is the app's configured chain; the wallet's own network comes from the
 * connection. Comparing the two is the only way to notice a wallet on the wrong network.
 */
export function useWrongNetwork(): boolean {
  const { isConnected, chainId } = useConnection();
  const appChainId = useChainId();
  return isConnected && chainId !== appChainId;
}
