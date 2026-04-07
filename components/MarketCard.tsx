'use client';

import type { useAccount } from 'wagmi';
import type { PodMarket } from '@/lib/podConfig';

interface MarketCardProps {
  pod: PodMarket;
  account: ReturnType<typeof useAccount>;
}

/**
 * MarketCard — displays a single prediction market's data and vote buttons.
 *
 * YOUR TASK: Build this component! It should:
 *
 * 1. Fetch market data (question, yesPool, noPool, resolved) using `useReadContracts`
 *    from wagmi — call `markets(0)` on the pod's market contract
 * 2. Fetch whether the connected wallet has already voted — call `hasVoted(0, address)`
 * 3. Display the market question, an odds bar (green/red), and pool sizes
 * 4. Show vote buttons that batch `approve` + `vote` using OnchainKit's <Transaction>
 *
 * Available imports you'll need:
 *   - `useReadContracts` from 'wagmi'
 *   - `formatEther, encodeFunctionData, parseEther` from 'viem'
 *   - `Transaction, TransactionButton, TransactionStatus` from '@coinbase/onchainkit/transaction'
 *   - `PredictionMarketABI, ERC20ABI` from '@/lib/contracts'
 *
 * See the Part 3 instructions for step-by-step guidance.
 */
export function MarketCard({ pod, account }: MarketCardProps) {
  return (
    <div className="border border-dashed border-yellow-600/50 rounded-xl p-5 flex flex-col items-center justify-center space-y-3 bg-yellow-900/10 min-h-[200px]">
      <div className="text-yellow-400 text-2xl">🔧</div>
      <div className="text-sm text-yellow-400 font-medium text-center">
        MarketCard not implemented yet
      </div>
      <div className="text-xs text-gray-500 text-center max-w-[200px]">
        {pod.owner}&apos;s market at{' '}
        <code className="text-gray-600 text-[10px]">
          {pod.marketAddress.slice(0, 6)}...{pod.marketAddress.slice(-4)}
        </code>
      </div>
    </div>
  );
}
