import { describe, it, expect } from 'vitest';
import { POD_MARKETS } from './podConfig';
import type { PodMarket } from './podConfig';

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

// These checks pass for the empty starter AND for a filled-in pod config,
// so they keep giving a useful signal after you add your pod's addresses.
describe('podConfig', () => {
  it('POD_MARKETS is an array', () => {
    expect(Array.isArray(POD_MARKETS)).toBe(true);
  });

  it.each(POD_MARKETS.map((m, i) => [i, m] as const))(
    'entry %i has an owner and two valid, different addresses',
    (_i, market) => {
      expect(market.owner.trim()).not.toBe('');
      expect(market.marketAddress).toMatch(ADDRESS);
      expect(market.tokenAddress).toMatch(ADDRESS);
      expect(market.marketAddress.toLowerCase()).not.toBe(market.tokenAddress.toLowerCase());
    },
  );

  it('has no duplicate market addresses', () => {
    const addresses = POD_MARKETS.map((m) => m.marketAddress.toLowerCase());
    expect(new Set(addresses).size).toBe(addresses.length);
  });

  it('PodMarket type enforces the required shape', () => {
    const example: PodMarket = {
      owner: 'Alice',
      marketAddress: '0x1234567890abcdef1234567890abcdef12345678',
      tokenAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    };
    expect(example.marketAddress).toMatch(ADDRESS);
  });
});
