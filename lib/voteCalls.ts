import { encodeFunctionData, parseEther } from 'viem';

import { ERC20ABI, PredictionMarketABI } from '@/lib/contracts';
import type { PodMarket } from '@/lib/podConfig';

/** Each vote stakes 10 of the market's token (18 decimals). */
export const VOTE_AMOUNT = parseEther('10');

export type EncodedCall = { to: `0x${string}`; data: `0x${string}` };

/**
 * The two calls one vote needs, already encoded, in order:
 *   1. approve(market, 10 tokens) on the pod's token, so the market may pull them
 *   2. vote(0, side, 10 tokens) on the market, which calls transferFrom
 * Pass the array straight to wagmi's useSendCalls: `sendCalls({ calls, experimental_fallback: true })`.
 */
export function buildVoteCalls(pod: PodMarket, side: boolean): EncodedCall[] {
  return [
    {
      to: pod.tokenAddress,
      data: encodeFunctionData({
        abi: ERC20ABI,
        functionName: 'approve',
        args: [pod.marketAddress, VOTE_AMOUNT],
      }),
    },
    {
      to: pod.marketAddress,
      data: encodeFunctionData({
        abi: PredictionMarketABI,
        functionName: 'vote',
        args: [0n, side, VOTE_AMOUNT],
      }),
    },
  ];
}
