'use client';

import { useReadContracts } from 'wagmi';
import type { useAccount } from 'wagmi';
import { formatEther, encodeFunctionData, parseEther } from 'viem';
import {
  Transaction,
  TransactionButton,
  TransactionSponsor,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
} from '@coinbase/onchainkit/transaction';

import type { PodMarket } from '@/lib/podConfig';
import { PredictionMarketABI, ERC20ABI } from '@/lib/contracts';

interface MarketCardProps {
  pod: PodMarket;
  account: ReturnType<typeof useAccount>;
}

export function MarketCard({ pod, account }: MarketCardProps) {
  const marketContract = {
    address: pod.marketAddress,
    abi: PredictionMarketABI,
    functionName: 'markets',
    args: [0n],
  } as const;

  const amountVotedContract = account.address
    ? ({
        address: pod.marketAddress,
        abi: PredictionMarketABI,
        functionName: 'amountVoted',
        args: [0n, account.address],
      } as const)
    : null;

  const { data } = useReadContracts({
    contracts: amountVotedContract
      ? [marketContract, amountVotedContract]
      : [marketContract],
  });

  const [marketResult, amountVotedResult] = data ?? [];
  const marketData = marketResult?.result as
    | [string, bigint, bigint, boolean, boolean]
    | undefined;

  const question = marketData?.[0] ?? 'Loading...';
  const yesPool = marketData?.[1] ?? 0n;
  const noPool = marketData?.[2] ?? 0n;
  const resolved = marketData?.[3] ?? false;
  const userStake = (amountVotedResult?.result as bigint) ?? 0n;

  const totalPool = yesPool + noPool;
  const yesPercent =
    totalPool > 0n ? Number((yesPool * 100n) / totalPool) : 50;
  const noPercent = 100 - yesPercent;

  const voteYesCalls = [
    {
      to: pod.tokenAddress,
      data: encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'approve',
        args: [pod.marketAddress, parseEther('10')],
      }),
    },
    {
      to: pod.marketAddress,
      data: encodeFunctionData({
        abi: PredictionMarketABI,
        functionName: 'vote',
        args: [0n, true, parseEther('10')],
      }),
    },
  ];

  const voteNoCalls = [
    {
      to: pod.tokenAddress,
      data: encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'approve',
        args: [pod.marketAddress, parseEther('10')],
      }),
    },
    {
      to: pod.marketAddress,
      data: encodeFunctionData({
        abi: PredictionMarketABI,
        functionName: 'vote',
        args: [0n, false, parseEther('10')],
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
        <div className="text-center text-yellow-400 text-sm font-medium">
          Market Resolved
        </div>
      ) : !account.address ? (
        <div className="text-center text-gray-500 text-sm">
          Connect wallet to vote
        </div>
      ) : (
        <>
          {userStake > 0n && (
            <div className="text-center text-gray-400 text-xs">
              You&apos;ve staked {formatEther(userStake)} tokens
            </div>
          )}
          <div className="flex gap-3">
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
        </>
      )}
    </div>
  );
}
