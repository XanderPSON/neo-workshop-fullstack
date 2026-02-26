import { describe, it, expect } from 'vitest';
import { POD_MARKETS } from './podConfig';
import type { PodMarket } from './podConfig';

describe('podConfig', () => {
  it('POD_MARKETS starts as an empty array (learners fill this in)', () => {
    expect(POD_MARKETS).toEqual([]);
  });

  it('PodMarket type enforces the required shape', () => {
    const example: PodMarket = {
      owner: 'Alice',
      marketAddress: '0x1234567890abcdef1234567890abcdef12345678',
      tokenAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    };
    expect(example.owner).toBe('Alice');
    expect(example.marketAddress).toMatch(/^0x/);
    expect(example.tokenAddress).toMatch(/^0x/);
  });
});
