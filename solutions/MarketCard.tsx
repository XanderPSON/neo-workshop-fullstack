// SOLUTION — Reference implementation for components/MarketCard.tsx (Part 3: Onchain Fullstack)
// This shows the completed useReadContracts + Transaction component integration.

'use client';

import {
  Transaction,
  TransactionButton,
  TransactionSponsor,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
} from '@coinbase/onchainkit/transaction';
import { encodeFunctionData, parseEther, formatEther } from 'viem';
import type { useAccount } from 'wagmi';
import { useReadContracts } from 'wagmi';
import { useState } from 'react';

import type { PodMarket } from '@/lib/podConfig';
import { PredictionMarketABI, ERC20ABI } from '@/lib/contracts';

export function MarketCard({
  pod,
  account,
}: {
  pod: PodMarket;
  account: ReturnType<typeof useAccount>;
}) {
  const { data } = useReadContracts({
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
        args: [0n, account.address!],
      },
    ],
  });

  const [marketResult, hasVotedResult] = data ?? [];

  const marketData = marketResult?.result as
    | [string, bigint, bigint, boolean, boolean]
    | undefined;

  const question = marketData?.[0] ?? 'Loading...';
  const yesPool = marketData?.[1] ?? BigInt(0);
  const noPool = marketData?.[2] ?? BigInt(0);
  const resolved = marketData?.[3] ?? false;
  const hasVoted = (hasVotedResult?.result as boolean) ?? false;

  const [voteAmount, setVoteAmount] = useState('10');

  const totalPool = yesPool + noPool;
  const yesPercent = totalPool > BigInt(0) ? Number((yesPool * BigInt(100)) / totalPool) : 50;
  const noPercent = 100 - yesPercent;

  const voteYesCalls = [
    {
      to: pod.tokenAddress,
      data: encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'approve',
        args: [pod.marketAddress, parseEther(voteAmount || '0')],
      }),
    },
    {
      to: pod.marketAddress,
      data: encodeFunctionData({
        abi: PredictionMarketABI,
        functionName: 'vote',
        args: [0n, true, parseEther(voteAmount || '0')],
      }),
    },
  ];

  const voteNoCalls = [
    {
      to: pod.tokenAddress,
      data: encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'approve',
        args: [pod.marketAddress, parseEther(voteAmount || '0')],
      }),
    },
    {
      to: pod.marketAddress,
      data: encodeFunctionData({
        abi: PredictionMarketABI,
        functionName: 'vote',
        args: [0n, false, parseEther(voteAmount || '0')],
      }),
    },
  ];

  return (
    <div className="border border-gray-700 rounded-xl p-5 flex flex-col space-y-4 bg-gray-900/50">
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
      ) : hasVoted ? (
        <div className="text-center text-gray-400 text-sm">You already voted on this market.</div>
      ) : !account.address ? (
        <div className="text-center text-gray-500 text-sm">Connect wallet to vote</div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="any"
              value={voteAmount}
              onChange={(e) => setVoteAmount(e.target.value)}
              placeholder="Token amount"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-gray-400 whitespace-nowrap">tokens</span>
          </div>
          <div className="flex gap-3">
            <Transaction calls={voteYesCalls}>
              <TransactionButton text={`Vote Yes (${voteAmount} Tokens)`} />
              <TransactionSponsor />
              <TransactionStatus>
                <TransactionStatusLabel />
                <TransactionStatusAction />
              </TransactionStatus>
            </Transaction>
            <Transaction calls={voteNoCalls}>
              <TransactionButton text={`Vote No (${voteAmount} Tokens)`} />
              <TransactionSponsor />
              <TransactionStatus>
                <TransactionStatusLabel />
                <TransactionStatusAction />
              </TransactionStatus>
            </Transaction>
          </div>
        </div>
      )}
    </div>
  );
}
