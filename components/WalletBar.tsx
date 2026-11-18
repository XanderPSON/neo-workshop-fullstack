'use client';

import { formatEther } from 'viem';
import {
  useBalance,
  useChainId,
  useChains,
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useSwitchChain,
} from 'wagmi';

import { useWrongNetwork } from '@/lib/network';

function short(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Connect / disconnect button with the connected address and Base Sepolia ETH balance.
 * While the wallet is on any other network it shows a warning and a switch button instead.
 */
export function WalletBar() {
  const { address, isConnected } = useConnection();
  const connectors = useConnectors();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { mutate: switchChain, isPending: isSwitching } = useSwitchChain();
  const wrongNetwork = useWrongNetwork();
  // The one network this app is configured for (lib/wagmi.ts).
  const appChainId = useChainId();
  const appChainName = useChains().find((chain) => chain.id === appChainId)?.name ?? 'the right network';

  // A wallet extension that announces itself gets a button under its own name (for example
  // "Coinbase Wallet"). The generic "Browser wallet" button is only a fallback, so a visitor
  // never sees two buttons for the same wallet.
  const named = connectors.filter((connector) => connector.id !== 'injected');
  const shown = named.length > 0 ? named : connectors;
  const { data: balance } = useBalance({ address, query: { enabled: !!address } });

  if (!isConnected || !address) {
    return (
      <div className="flex gap-2">
        {shown.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {connector.name === 'Injected' ? 'Browser wallet' : connector.name}
          </button>
        ))}
      </div>
    );
  }

  if (wrongNetwork) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-3 rounded-lg border border-red-700 bg-red-950/70 px-3 py-2 text-sm"
      >
        <span className="font-medium text-red-200">Wrong network</span>
        <button
          onClick={() => switchChain({ chainId: appChainId })}
          disabled={isSwitching}
          className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-500 disabled:opacity-50"
        >
          Switch to {appChainName}
        </button>
        <button onClick={() => disconnect()} className="text-gray-400 hover:text-red-300">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900/70 px-3 py-2 text-sm">
      <button
        onClick={() => navigator.clipboard?.writeText(address)}
        title="Copy address"
        className="font-mono text-gray-200 hover:text-white"
      >
        {short(address)}
      </button>
      {balance && (
        <span className="text-gray-400">{Number(formatEther(balance.value)).toFixed(4)} ETH</span>
      )}
      <button onClick={() => disconnect()} className="text-gray-500 hover:text-red-400">
        Disconnect
      </button>
    </div>
  );
}
