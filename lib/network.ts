import { useConnection } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

/**
 * True when a wallet is connected but sits on any network other than Base Sepolia.
 * The wallet's own network comes from the connection; `useChainId()` only reports the
 * app's configured chain, so it can never see a wallet that is on the wrong network.
 */
export function useWrongNetwork(): boolean {
  const { isConnected, chainId } = useConnection();
  return isConnected && chainId !== baseSepolia.id;
}
