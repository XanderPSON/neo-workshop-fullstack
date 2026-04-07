// SOLUTION — Reference implementation for app/api/markets/route.ts (Part 3: Onchain Fullstack)
// A Next.js API route that reads market data from all pod contracts using Viem.

import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { NextResponse } from 'next/server';

import { POD_MARKETS } from '@/lib/podConfig';
import { PredictionMarketABI } from '@/lib/contracts';

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC ?? 'https://sepolia.base.org'),
});

export async function GET() {
  try {
    const markets = await Promise.all(
      POD_MARKETS.map(async (pod) => {
        try {
          const result = await client.readContract({
            address: pod.marketAddress,
            abi: PredictionMarketABI,
            functionName: 'markets',
            args: [0n],
          });

          const [question, yesPool, noPool, resolved, outcome] = result as [
            string,
            bigint,
            bigint,
            boolean,
            boolean,
          ];

          return {
            owner: pod.owner,
            marketAddress: pod.marketAddress,
            tokenAddress: pod.tokenAddress,
            question,
            yesPool: formatEther(yesPool),
            noPool: formatEther(noPool),
            resolved,
            outcome,
          };
        } catch (err) {
          return {
            owner: pod.owner,
            marketAddress: pod.marketAddress,
            tokenAddress: pod.tokenAddress,
            error: err instanceof Error ? err.message : 'Failed to read contract',
          };
        }
      }),
    );

    return NextResponse.json({ markets });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
