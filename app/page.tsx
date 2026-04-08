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
import { useEffect, useState } from 'react';

import { POD_MARKETS } from '@/lib/podConfig';
import { MarketCard } from '@/components/MarketCard';

function ChecklistItem({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className={done ? 'text-green-400' : 'text-gray-600'}>
        {done ? '✅' : '⬜'}
      </span>
      <span>{children}</span>
    </div>
  );
}

export default function App() {
  const account = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const podConfigDone = POD_MARKETS.length > 0;
  const [apiRouteDone, setApiRouteDone] = useState(false);
  const [marketCardDone, setMarketCardDone] = useState(false);
  const [transactionDone, setTransactionDone] = useState(false);

  useEffect(() => {
    if (chainId && chainId !== baseSepolia.id) {
      switchChain({ chainId: baseSepolia.id });
    }
  }, [chainId, switchChain]);

  useEffect(() => {
    if (!podConfigDone) return;
    fetch('/api/markets')
      .then((res) => setApiRouteDone(res.ok))
      .catch(() => setApiRouteDone(false));
  }, [podConfigDone]);

  useEffect(() => {
    if (!podConfigDone) return;
    const timer = setTimeout(() => {
      setMarketCardDone(!document.querySelector('[data-market-stub]'));
      setTransactionDone(!!document.querySelector('[data-testid*="ockTransaction"]'));
    }, 500);
    return () => clearTimeout(timer);
  }, [podConfigDone]);

  const allDone = podConfigDone && apiRouteDone && marketCardDone && transactionDone;
  const completedCount = [true, podConfigDone, apiRouteDone, marketCardDone, transactionDone].filter(Boolean).length;

  const checklist = (
    <>
      <ChecklistItem done={true}>App running</ChecklistItem>
      <ChecklistItem done={podConfigDone}>
        Add contract addresses to{' '}
        <code className="bg-gray-800 px-2 py-0.5 rounded text-sm">lib/podConfig.ts</code>
      </ChecklistItem>
      <ChecklistItem done={apiRouteDone}>
        Build the API route{' '}
        <code className="bg-gray-800 px-2 py-0.5 rounded text-sm">app/api/markets/route.ts</code>
      </ChecklistItem>
      <ChecklistItem done={marketCardDone}>
        Build the{' '}
        <code className="bg-gray-800 px-2 py-0.5 rounded text-sm">MarketCard</code>{' '}
        component
      </ChecklistItem>
      <ChecklistItem done={transactionDone}>
        Wire up voting with{' '}
        <code className="bg-gray-800 px-2 py-0.5 rounded text-sm">&lt;Transaction&gt;</code>
      </ChecklistItem>
    </>
  );

  if (!podConfigDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen font-sans dark:bg-background dark:text-white bg-white text-black">
        <div className="text-center max-w-lg space-y-6">
          <h1 className="text-3xl font-bold">🔮 Prediction Market Aggregator</h1>
          <p className="text-gray-400">
            Your dashboard isn&apos;t wired up yet. Follow the Part 3 instructions to build it:
          </p>
          <div className="text-left space-y-3 bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            {checklist}
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

      <h1 className="text-3xl font-bold mb-6 mt-4">🔮 Prediction Market Aggregator</h1>

      {/* Workshop progress checklist */}
      {!allDone && (
        <div className="w-full max-w-5xl mb-6">
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">
              Workshop Progress — {completedCount}/5
            </div>
            <div className="space-y-2 text-sm">
              {checklist}
            </div>
          </div>
        </div>
      )}

      {/* Market cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        {POD_MARKETS.map((pod, i) => (
          <MarketCard key={i} pod={pod} account={account} />
        ))}
      </div>
    </div>
  );
}
