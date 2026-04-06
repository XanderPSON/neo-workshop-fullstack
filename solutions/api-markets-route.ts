import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { NextResponse } from 'next/server';

import { POD_MARKETS } from '@/lib/podConfig';
import { PredictionMarketABI } from '@/lib/contracts';

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
});

export async function GET() {
  try {
    const markets = await Promise.all(
      POD_MARKETS.map(async (pod) => {
        const data = await client.readContract({
          address: pod.marketAddress,
          abi: PredictionMarketABI,
          functionName: 'markets',
          args: [0n],
        });

        const [question, yesPool, noPool, resolved, outcome] = data as [
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
      }),
    );

    return NextResponse.json({ markets });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch markets' },
      { status: 500 },
    );
  }
}
