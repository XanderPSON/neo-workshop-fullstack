import { NextResponse } from 'next/server';
import { baseSepolia } from 'viem/chains';
import { createPublicClient, formatEther, http } from 'viem';
import { PredictionMarketABI } from '@/lib/contracts';
import { POD_MARKETS } from '@/lib/podConfig';

export async function GET() {
  try {
    const rpcUrl = process.env.BASE_SEPOLIA_RPC;
    if (!rpcUrl) {
      throw new Error('Missing BASE_SEPOLIA_RPC environment variable');
    }

    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    const markets = await Promise.all(
      POD_MARKETS.map(async ({ owner, marketAddress, tokenAddress }) => {
        const [question, yesPool, noPool, resolved] = await client.readContract({
          address: marketAddress,
          abi: PredictionMarketABI,
          functionName: 'markets',
          args: [0n],
        });

        return {
          owner,
          marketAddress,
          tokenAddress,
          question,
          yesPool: formatEther(yesPool),
          noPool: formatEther(noPool),
          resolved,
        };
      }),
    );

    return NextResponse.json({ markets });
  } catch (error) {
    console.error('Failed to fetch markets', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch market data',
      },
      { status: 500 },
    );
  }
}
