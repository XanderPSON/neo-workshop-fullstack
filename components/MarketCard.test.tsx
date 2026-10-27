import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MarketCard } from './MarketCard';

// Hook mocks so the card renders the same way before and after you wire it up.
vi.mock('wagmi', () => ({
  useReadContracts: () => ({
    data: [{ status: 'success', result: ['Will it rain?', 30n * 10n ** 18n, 10n * 10n ** 18n, false, false] }],
    refetch: vi.fn(),
    error: null,
    isFetching: false,
  }),
  useSendCalls: () => ({ mutate: vi.fn(), data: undefined, isPending: false, error: null, reset: vi.fn() }),
  useWaitForCallsStatus: () => ({ data: undefined, error: null }),
}));

const pod = {
  owner: 'TestAlice',
  marketAddress: '0x1111111111111111111111111111111111111111',
  tokenAddress: '0x2222222222222222222222222222222222222222',
} as const;

describe('MarketCard', () => {
  it("shows the owner's market and asks a disconnected user to connect", () => {
    const account = { address: undefined } as unknown as Parameters<typeof MarketCard>[0]['account'];
    render(<MarketCard pod={pod} account={account} />);
    expect(screen.getByText(/TestAlice's Market/)).toBeInTheDocument();
    expect(screen.getByText('Connect wallet to vote')).toBeInTheDocument();
  });

  it('shows Yes and No percentages that add up to 100', () => {
    const account = { address: undefined } as unknown as Parameters<typeof MarketCard>[0]['account'];
    render(<MarketCard pod={pod} account={account} />);
    const yes = Number(screen.getByText(/^Yes \d+%$/).textContent!.match(/\d+/)![0]);
    const no = Number(screen.getByText(/^No \d+%$/).textContent!.match(/\d+/)![0]);
    expect(yes + no).toBe(100);
  });
});
