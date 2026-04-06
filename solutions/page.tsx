// SOLUTION — Reference implementation for app/page.tsx (Part 3: Onchain Fullstack)
// This shows the completed useReadContracts + Transaction component integration.

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
import {
  Transaction,
  TransactionButton,
  TransactionSponsor,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
} from '@coinbase/onchainkit/transaction';
import { encodeFunctionData, parseEther, formatEther } from 'viem';
import { useAccount, useChainId, useReadContracts, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { useEffect } from 'react';

import { POD_MARKETS } from '@/lib/podConfig';
import { PredictionMarketABI, ERC20ABI } from '@/lib/contracts';

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
        <div className="text-center max-w-md space-y-4">
          <h1 className="text-2xl font-bold">Prediction Market Aggregator</h1>
          <p className="text-gray-400">
            No markets configured yet. Open{' '}
            <code className="bg-gray-800 px-2 py-0.5 rounded text-sm">lib/podConfig.ts</code>{' '}
            and add your pod&apos;s Market and Token addresses.
          </p>
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

function MarketCard({
  pod,
  account,
}: {
  pod: (typeof POD_MARKETS)[number];
  account: ReturnType<typeof useAccount>;
}) {
  // Read market data + hasVoted in a single multicall
  const { data } = useReadContracts({
    contracts: [
      {
        address: pod.marketAddress as `0x${string}`,
        abi: PredictionMarketABI,
        functionName: 'markets',
        args: [0n],
      },
      {
        address: pod.marketAddress as `0x${string}`,
        abi: PredictionMarketABI,
        functionName: 'hasVoted',
        args: [0n, account.address!],
      },
    ],
  });

  const [marketResult, hasVotedResult] = data ?? [];

  // Destructure the market struct: [question, yesPool, noPool, resolved, outcome]
  const marketData = marketResult?.result as
    | [string, bigint, bigint, boolean, boolean]
    | undefined;

  const question = marketData?.[0] ?? 'Loading...';
  const yesPool = marketData?.[1] ?? BigInt(0);
  const noPool = marketData?.[2] ?? BigInt(0);
  const resolved = marketData?.[3] ?? false;
  const hasVoted = (hasVotedResult?.result as boolean) ?? false;

  const totalPool = yesPool + noPool;
  const yesPercent = totalPool > BigInt(0) ? Number((yesPool * BigInt(100)) / totalPool) : 50;
  const noPercent = 100 - yesPercent;

  // Batched approve + vote calls
  const voteYesCalls = [
    {
      to: pod.tokenAddress as `0x${string}`,
      data: encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'approve',
        args: [pod.marketAddress as `0x${string}`, parseEther('10')],
      }),
    },
    {
      to: pod.marketAddress as `0x${string}`,
      data: encodeFunctionData({
        abi: PredictionMarketABI,
        functionName: 'vote',
        args: [0n, true, parseEther('10')],
      }),
    },
  ];

  const voteNoCalls = [
    {
      to: pod.tokenAddress as `0x${string}`,
      data: encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'approve',
        args: [pod.marketAddress as `0x${string}`, parseEther('10')],
      }),
    },
    {
      to: pod.marketAddress as `0x${string}`,
      data: encodeFunctionData({
        abi: PredictionMarketABI,
        functionName: 'vote',
        args: [0n, false, parseEther('10')],
      }),
    },
  ];

  return (
    <div className="border border-gray-700 rounded-xl p-5 flex flex-col space-y-4 bg-gray-900/50">
      {/* Owner label */}
      <div className="text-sm text-gray-400">{pod.owner}&apos;s Market</div>

      {/* Question */}
      <div className="text-lg font-semibold">{question}</div>

      {/* Odds bar */}
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

      {/* Status / Vote buttons */}
      {resolved ? (
        <div className="text-center text-yellow-400 text-sm font-medium">Market Resolved</div>
      ) : hasVoted ? (
        <div className="text-center text-gray-400 text-sm">You already voted on this market.</div>
      ) : !account.address ? (
        <div className="text-center text-gray-500 text-sm">Connect wallet to vote</div>
      ) : (
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
      )}
    </div>
  );
}
