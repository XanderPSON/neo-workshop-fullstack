'use client';

import {
  Address,
  Avatar,
  EthBalance,
  Identity,
  Name,
} from '@coinbase/onchainkit/identity';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
  WalletDropdownLink,
} from '@coinbase/onchainkit/wallet';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { useEffect } from 'react';

import { POD_MARKETS } from '@/lib/podConfig';
import { MarketCard } from '@/components/MarketCard';

export default function App() {
  const account = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (chainId && chainId !== baseSepolia.id) {
      switchChain({ chainId: baseSepolia.id });
    }
  }, [chainId, switchChain]);

  if (POD_MARKETS.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen font-sans dark:bg-background dark:text-white bg-white text-black">
        <div className="text-center max-w-lg space-y-6">
          <h1 className="text-3xl font-bold">🔮 Prediction Market Aggregator</h1>
          <p className="text-gray-400">
            Your dashboard isn&apos;t wired up yet. Follow the Part 3 instructions to build it:
          </p>
          <div className="text-left space-y-3 bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <span className="text-green-400">✅</span>
              <span>App running</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600">⬜</span>
              <span>
                Add contract addresses to{' '}
                <code className="bg-gray-800 px-2 py-0.5 rounded text-sm">lib/podConfig.ts</code>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600">⬜</span>
              <span>
                Build the API route{' '}
                <code className="bg-gray-800 px-2 py-0.5 rounded text-sm">app/api/markets/route.ts</code>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600">⬜</span>
              <span>
                Build the{' '}
                <code className="bg-gray-800 px-2 py-0.5 rounded text-sm">MarketCard</code>{' '}
                component
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600">⬜</span>
              <span>
                Wire up voting with{' '}
                <code className="bg-gray-800 px-2 py-0.5 rounded text-sm">&lt;Transaction&gt;</code>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen font-sans dark:bg-background dark:text-white bg-white text-black p-8">
      {/* Wallet connection */}
      <div className="absolute top-4 right-4">
        <Wallet>
          <ConnectWallet>
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
              <EthBalance />
            </Identity>
            <WalletDropdownLink
              icon="wallet"
              href="https://keys.coinbase.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Wallet
            </WalletDropdownLink>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>

      <h1 className="text-3xl font-bold mb-8 mt-4">Prediction Market Aggregator</h1>

      {/* Market cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        {POD_MARKETS.map((pod, i) => (
          <MarketCard key={i} pod={pod} account={account} />
        ))}
      </div>
    </div>
  );
}
