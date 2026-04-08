'use client';

import {
  encodeFunctionData,
  formatEther,
  parseEther,
} from 'viem';
import type { useAccount } from 'wagmi';
import { useReadContracts } from 'wagmi';
import {
  Transaction,
  TransactionButton,
  TransactionSponsor,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
} from '@coinbase/onchainkit/transaction';
import { ERC20ABI, PredictionMarketABI } from '@/lib/contracts';
import type { PodMarket } from '@/lib/podConfig';

interface MarketCardProps {
  pod: PodMarket;
  account: ReturnType<typeof useAccount>;
}

export function MarketCard({ pod, account }: MarketCardProps) {
  const walletAddress =
    account.address ?? '0x0000000000000000000000000000000000000000';

  const { data, isLoading, isError } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: pod.marketAddress,
        abi: PredictionMarketABI,
        functionName: 'markets',
        args: [0n],
      },
      {
        address: pod.marketAddress,
        abi: PredictionMarketABI,
        functionName: 'hasVoted',
        args: [0n, walletAddress],
      },
    ],
  });

  const market = data?.[0] as
    | readonly [string, bigint, bigint, boolean, boolean]
    | undefined;
  const hasVoted = (data?.[1] as boolean | undefined) ?? false;

  const question = market?.[0] ?? (isLoading ? 'Loading market...' : 'Unavailable');
  const yesPool = market?.[1] ?? 0n;
  const noPool = market?.[2] ?? 0n;
  const resolved = market?.[3] ?? false;

  const totalPool = yesPool + noPool;
  const yesPct = totalPool === 0n ? 50 : Number((yesPool * 10_000n) / totalPool) / 100;
  const noPct = Math.max(0, 100 - yesPct);
  const voteAmount = parseEther('10');

  const voteYesCalls = [
    {
      to: pod.tokenAddress,
      data: encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'approve',
        args: [pod.marketAddress, voteAmount],
      }),
    },
    {
      to: pod.marketAddress,
      data: encodeFunctionData({
        abi: PredictionMarketABI,
        functionName: 'vote',
        args: [0n, true, voteAmount],
      }),
    },
  ];

  const voteNoCalls = [
    {
      to: pod.tokenAddress,
      data: encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'approve',
        args: [pod.marketAddress, voteAmount],
      }),
    },
    {
      to: pod.marketAddress,
      data: encodeFunctionData({
        abi: PredictionMarketABI,
        functionName: 'vote',
        args: [0n, false, voteAmount],
      }),
    },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-3 text-sm font-semibold text-slate-200">{pod.owner}</div>

      <h3 className="mb-4 min-h-[48px] text-base font-medium text-white">
        {question}
      </h3>

      <div className="mb-2 overflow-hidden rounded-full bg-slate-700">
        <div className="flex h-3 w-full">
          <div className="bg-emerald-500 transition-all" style={{ width: `${yesPct}%` }} />
          <div className="bg-red-500 transition-all" style={{ width: `${noPct}%` }} />
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between text-xs text-slate-300">
        <span>Yes {yesPct.toFixed(1)}%</span>
        <span>No {noPct.toFixed(1)}%</span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md bg-slate-800/70 p-2 text-emerald-300">
          Yes Pool: {formatEther(yesPool)}
        </div>
        <div className="rounded-md bg-slate-800/70 p-2 text-red-300">
          No Pool: {formatEther(noPool)}
        </div>
      </div>

      {isError ? (
        <div className="rounded-md bg-red-950/40 px-3 py-2 text-sm text-red-300">
          Failed to load market data
        </div>
      ) : resolved ? (
        <div className="rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-200">
          Market Resolved
        </div>
      ) : hasVoted ? (
        <div className="rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-200">
          Already voted
        </div>
      ) : !account.address ? (
        <div className="rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-200">
          Connect wallet
        </div>
      ) : (
        <div className="grid gap-3">
          <Transaction calls={voteYesCalls}>
            <TransactionButton text="Vote Yes (10 Tokens)" />
            <TransactionSponsor />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>

          <Transaction calls={voteNoCalls}>
            <TransactionButton text="Vote No (10 Tokens)" />
            <TransactionSponsor />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>
        </div>
      )}
    </div>
  );
}
