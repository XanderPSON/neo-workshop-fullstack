'use client';

import type { useConnection } from 'wagmi';
import { formatEther } from 'viem';

import type { PodMarket } from '@/lib/podConfig';

interface MarketCardProps {
  pod: PodMarket;
  account: ReturnType<typeof useConnection>;
}

/**
 * MarketCard — displays a single prediction market's data and vote buttons.
 *
 * The layout below is provided. It renders placeholder values until you wire it up.
 *
 * YOUR TASKS:
 *
 * Task 2 (reads + odds):
 *   - Replace the placeholder values with ONE `useReadContracts` call (wagmi) that reads
 *     `markets(0n)` from `pod.marketAddress` and, when `account.address` is set,
 *     `amountVoted(0n, account.address)`. The market result is
 *     `[question, yesPool, noPool, resolved, outcome]`.
 *   - Replace the 50/50 odds with BigInt math (50/50 when both pools are zero).
 *   - Delete the `data-market-stub` attribute once real data shows.
 *
 * Task 3 (voting):
 *   - `buildVoteCalls(pod, side)` in '@/lib/voteCalls' already encodes the two calls
 *     (approve, then vote). Send them as one batch with wagmi's `useSendCalls`
 *     (`experimental_fallback: true`), track the batch with `useWaitForCallsStatus`,
 *     and call `refetch` from your `useReadContracts` once it succeeds.
 *   - Replace the placeholder buttons with Vote Yes / Vote No buttons. Keep
 *     `data-vote-button` on both, and keep them disabled until the market has loaded
 *     and while a batch is in flight.
 *
 * Imports you'll need: `useReadContracts`, `useSendCalls`, `useWaitForCallsStatus` from 'wagmi';
 * `PredictionMarketABI` from '@/lib/contracts'; `buildVoteCalls` from '@/lib/voteCalls'.
 */
export function MarketCard({ pod, account }: MarketCardProps) {
  // TODO (Task 2): read these from the chain with one useReadContracts call.
  const question = `${pod.owner}'s market (not wired up yet)`;
  const yesPool = 0n;
  const noPool = 0n;
  const resolved = false;
  const userStake = 0n;

  // TODO (Task 2): odds math in BigInt. Convert to Number only after dividing.
  const yesPercent = 50;
  const noPercent = 100 - yesPercent;

  return (
    <div
      data-market-stub
      className="border border-gray-700 rounded-xl p-5 flex flex-col space-y-4 bg-gray-900/50"
    >
      <div className="text-sm text-gray-400">{pod.owner}&apos;s Market</div>

      <div className="text-lg font-semibold">{question}</div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-green-400">Yes {yesPercent}%</span>
          <span className="text-red-400">No {noPercent}%</span>
        </div>
        <div className="w-full h-3 bg-red-500/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${yesPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatEther(yesPool)} tokens</span>
          <span>{formatEther(noPool)} tokens</span>
        </div>
      </div>

      {resolved ? (
        <div className="text-center text-yellow-400 text-sm font-medium">Market Resolved</div>
      ) : !account.address ? (
        <div className="text-center text-gray-500 text-sm">Connect wallet to vote</div>
      ) : (
        <>
          {userStake > 0n && (
            <div className="text-center text-gray-400 text-xs">
              You&apos;ve staked {formatEther(userStake)} tokens
            </div>
          )}
          {/* TODO (Task 3): replace these placeholders with real vote buttons. */}
          <div className="flex gap-3">
            <button
              disabled
              className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Vote Yes (10 Tokens)
            </button>
            <button
              disabled
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Vote No (10 Tokens)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
