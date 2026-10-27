'use client';

import { formatEther } from 'viem';
import { useBalance, useConnect, useConnection, useConnectors, useDisconnect } from 'wagmi';

function short(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Connect / disconnect button with the connected address and Base Sepolia ETH balance. */
export function WalletBar() {
  const { address, isConnected } = useConnection();
  const connectors = useConnectors();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address, query: { enabled: !!address } });

  if (!isConnected || !address) {
    return (
      <div className="flex gap-2">
        {connectors.map((connector) => (
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
