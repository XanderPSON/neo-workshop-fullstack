'use client';

import { WalletBar } from '@/components/WalletBar';
import { useConnection, useChainId, useSwitchChain } from 'wagmi';
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
  const account = useConnection();
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

  // Re-check the API route every few seconds until it answers, so saving
  // route.ts ticks the box without a reload. 402 counts: the route is built
  // and gated with x402 (Task 4).
  useEffect(() => {
    if (!podConfigDone || apiRouteDone) return;
    let cancelled = false;
    const check = () => {
      fetch('/api/markets')
        .then((res) => {
          if (!cancelled) setApiRouteDone(res.ok || res.status === 402);
        })
        .catch(() => {
          if (!cancelled) setApiRouteDone(false);
        });
    };
    check();
    const timer = setInterval(check, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [podConfigDone, apiRouteDone]);

  // Watch the DOM instead of checking it once: cards render their vote buttons
  // only after reads succeed and a wallet connects, which can happen any time.
  useEffect(() => {
    if (!podConfigDone) return;
    const update = () => {
      setMarketCardDone(!document.querySelector('[data-market-stub]'));
      setTransactionDone(!!document.querySelector('[data-vote-button]'));
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-market-stub', 'data-vote-button'],
    });
    return () => observer.disconnect();
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
        <code className="bg-gray-800 px-2 py-0.5 rounded text-sm">useSendCalls</code>
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
        <WalletBar />
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
