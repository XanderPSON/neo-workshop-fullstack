import { describe, it, expect } from 'vitest';
import { decodeFunctionData } from 'viem';

import { ERC20ABI, PredictionMarketABI } from './contracts';
import { VOTE_AMOUNT, buildVoteCalls } from './voteCalls';

const pod = {
  owner: 'TestAlice',
  marketAddress: '0x1111111111111111111111111111111111111111',
  tokenAddress: '0x2222222222222222222222222222222222222222',
} as const;

describe('buildVoteCalls', () => {
  it('approves the market on the token first, then votes on the market', () => {
    const [approve, vote] = buildVoteCalls(pod, true);
    expect(approve.to).toBe(pod.tokenAddress);
    expect(vote.to).toBe(pod.marketAddress);

    const approveArgs = decodeFunctionData({ abi: ERC20ABI, data: approve.data });
    expect(approveArgs.functionName).toBe('approve');
    expect(approveArgs.args).toEqual([pod.marketAddress, VOTE_AMOUNT]);

    const voteArgs = decodeFunctionData({ abi: PredictionMarketABI, data: vote.data });
    expect(voteArgs.functionName).toBe('vote');
    expect(voteArgs.args).toEqual([0n, true, VOTE_AMOUNT]);
  });

  it('encodes the chosen side and stakes exactly 10 tokens', () => {
    const [, vote] = buildVoteCalls(pod, false);
    const { args } = decodeFunctionData({ abi: PredictionMarketABI, data: vote.data });
    expect(args).toEqual([0n, false, 10n * 10n ** 18n]);
  });
});
