// Day 2, Part 4 solution: the same /api/markets route, now paid with x402.
// Copy over app/api/markets/route.ts. Requires X402_PAY_TO in .env.local / Vercel env.
import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { NextResponse, type NextRequest } from 'next/server';
import { withX402 } from '@x402/next';

import { POD_MARKETS } from '@/lib/podConfig';
import { PredictionMarketABI } from '@/lib/contracts';
import { X402_NETWORK, payTo, x402Server } from '@/lib/x402';

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
});

async function handler(_request: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const markets = await Promise.all(
      POD_MARKETS.map(async (pod) => {
        const [question, yesPool, noPool, resolved, outcome] = (await client.readContract({
          address: pod.marketAddress,
          abi: PredictionMarketABI,
          functionName: 'markets',
          args: [0n],
        })) as [string, bigint, bigint, boolean, boolean];

        const total = yesPool + noPool;
        return {
          owner: pod.owner,
          marketAddress: pod.marketAddress,
          tokenAddress: pod.tokenAddress,
          question,
          yesPool: formatEther(yesPool),
          noPool: formatEther(noPool),
          // The value-add a buyer pays for: implied odds, ready to use.
          impliedYes: total > 0n ? Number((yesPool * 10000n) / total) / 100 : null,
          resolved,
          outcome,
        };
      }),
    );

    return NextResponse.json({ markets, readAt: new Date().toISOString() });
  } catch (error) {
    // Status >= 400 means withX402 does NOT settle the payment: buyers are not charged for errors.
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch markets' },
      { status: 500 },
    );
  }
}

export const GET = withX402(
  handler,
  {
    accepts: [
      {
        scheme: 'exact',
        price: '$0.01', // paid in test USDC on Base Sepolia
        network: X402_NETWORK,
        payTo: () => payTo(), // resolved per request so a missing env var fails loudly, not at build
      },
    ],
    description: 'Live snapshot of this pod\'s prediction markets with implied odds',
    mimeType: 'application/json',
  },
  x402Server,
);
