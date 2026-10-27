'use client';

import { useReadContracts, useSendCalls, useWaitForCallsStatus } from 'wagmi';
import type { useConnection } from 'wagmi';
import { formatEther } from 'viem';
import { useEffect, useState } from 'react';

import type { PodMarket } from '@/lib/podConfig';
import { PredictionMarketABI } from '@/lib/contracts';
import { buildVoteCalls } from '@/lib/voteCalls';

interface MarketCardProps {
  pod: PodMarket;
  account: ReturnType<typeof useConnection>;
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

  const { data, refetch, error: readError, isFetching } = useReadContracts({
    contracts: amountVotedContract
      ? [marketContract, amountVotedContract]
      : [marketContract],
  });

  const [marketResult, amountVotedResult] = data ?? [];
  const marketData = marketResult?.result as
    | [string, bigint, bigint, boolean, boolean]
    | undefined;

  // A bad address or a dead RPC shows up here, not as "Loading..." forever.
  // Transport errors land in readError; a single failed call has status 'failure'.
  const readFailed = !!readError || marketResult?.status === 'failure';
  const question = marketData?.[0] ?? (readFailed ? 'Could not read this market' : 'Loading...');
  const yesPool = marketData?.[1] ?? 0n;
  const noPool = marketData?.[2] ?? 0n;
  const resolved = marketData?.[3] ?? false;
  const userStake = (amountVotedResult?.result as bigint) ?? 0n;

  const totalPool = yesPool + noPool;
  const yesPercent =
    totalPool > 0n ? Number((yesPool * 100n) / totalPool) : 50;
  const noPercent = 100 - yesPercent;

  // Vote only on a market you've actually read: no data, no buttons.
  const marketReady = !!marketData && !readFailed;

  // One click = two calls: approve the market to pull 10 tokens, then vote.
  // lib/voteCalls.ts encodes them. Smart wallets (Base Account) batch them into one
  // approval; other wallets fall back to two transactions (experimental_fallback).
  const { mutate: sendCalls, data: sent, isPending, error, reset } = useSendCalls();
  const {
    data: status,
    error: statusError,
    refetch: refetchStatus,
    isFetching: isCheckingStatus,
  } = useWaitForCallsStatus({ id: sent?.id, query: { enabled: !!sent?.id } });
  const confirmed = status?.status === 'success';
  const reverted = status?.status === 'failure';

  // Your stake when you clicked. If tracking fails, a bigger stake on re-read proves the vote landed.
  const [stakeAtSend, setStakeAtSend] = useState<bigint | null>(null);
  const landedByStake = !!sent?.id && stakeAtSend !== null && userStake > stakeAtSend;
  // Sent, but we can't tell whether it landed: keep the buttons locked until we can.
  const uncertain = !!sent?.id && !!statusError && !landedByStake;

  // Busy from the signature prompt until the batch is known to have landed or failed,
  // not just while the wallet popup is open. Re-enabling earlier invites double votes.
  const busy =
    isPending ||
    (!!sent?.id && !error && !confirmed && !reverted && !landedByStake);
  useEffect(() => {
    // Pools changed onchain: re-read them once the batch confirms.
    if (confirmed) void refetch();
  }, [confirmed, refetch]);

  const vote = (side: boolean) => {
    reset();
    setStakeAtSend(userStake);
    sendCalls({ calls: buildVoteCalls(pod, side), experimental_fallback: true });
  };

  return (
    <div className="border border-gray-700 rounded-xl p-5 flex flex-col space-y-4 bg-gray-900/50">
      <div className="text-sm text-gray-400">{pod.owner}&apos;s Market</div>

      <div className="text-lg font-semibold">{question}</div>

      {readFailed && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-500/40 bg-red-900/20 px-3 py-2 text-xs text-red-300">
          <span>
            Read failed. Check this market address in lib/podConfig.ts, then retry.
          </span>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="rounded-md border border-red-400/50 px-2 py-1 font-medium hover:bg-red-500/20 disabled:opacity-50"
          >
            {isFetching ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

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
            <button
              data-vote-button
              disabled={busy || !marketReady}
              onClick={() => vote(true)}
              className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
            >
              Vote Yes (10 Tokens)
            </button>
            <button
              data-vote-button
              disabled={busy || !marketReady}
              onClick={() => vote(false)}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              Vote No (10 Tokens)
            </button>
          </div>
          <div className="text-center text-xs text-gray-400 min-h-4">
            {isPending && 'Approve in your wallet...'}
            {sent?.id && !status && !statusError && !landedByStake && 'Submitted, waiting for Base Sepolia...'}
            {status?.status === 'pending' && 'Waiting for Base Sepolia...'}
            {confirmed && 'Vote confirmed onchain ✅'}
            {reverted && 'Transaction reverted ❌'}
            {landedByStake && !confirmed && 'Vote landed: your stake went up ✅'}
            {uncertain && (
              <span className="text-red-400">
                Could not track this batch, so voting stays locked. Check your address on BaseScan,
                then{' '}
                <button
                  type="button"
                  onClick={() => {
                    void refetchStatus();
                    void refetch();
                  }}
                  disabled={isCheckingStatus || isFetching}
                  className="underline disabled:opacity-50"
                >
                  {isCheckingStatus || isFetching ? 'checking...' : 'check again'}
                </button>
                .
              </span>
            )}
            {error && <span className="text-red-400">{error.message.split('\n')[0]}</span>}
          </div>
        </>
      )}
    </div>
  );
}
