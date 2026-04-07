import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      message:
        'Not implemented yet. Build this route to read market data from the blockchain using Viem.',
      file: 'app/api/markets/route.ts',
      hint: 'Use createPublicClient with baseSepolia to call markets(0) on each POD_MARKETS entry.',
    },
    { status: 501 },
  );
}
