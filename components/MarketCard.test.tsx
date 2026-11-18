import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MarketCard } from './MarketCard';

// Hook mocks so the card renders the same way before and after you wire it up.
const okRead = {
  data: [{ status: 'success', result: ['Will it rain?', 30n * 10n ** 18n, 10n * 10n ** 18n, false, false] }],
  refetch: vi.fn(),
  error: null,
  isFetching: false,
};
const failedRead = {
  data: [{ status: 'failure', error: new Error('bad address'), result: undefined }],
  refetch: vi.fn(),
  error: null,
  isFetching: false,
};
let readState: typeof okRead | typeof failedRead = okRead;

vi.mock('wagmi', () => ({
  useReadContracts: () => readState,
  useSendCalls: () => ({ mutate: vi.fn(), data: undefined, isPending: false, error: null, reset: vi.fn() }),
  useWaitForCallsStatus: () => ({ data: undefined, error: null, refetch: vi.fn(), isFetching: false }),
}));

const pod = {
  owner: 'TestAlice',
  marketAddress: '0x1111111111111111111111111111111111111111',
  tokenAddress: '0x2222222222222222222222222222222222222222',
} as const;

describe('MarketCard', () => {
  beforeEach(() => {
    readState = okRead;
  });

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

  it('never lets you vote on a market it could not read', () => {
    readState = failedRead;
    const account = {
      address: '0x3333333333333333333333333333333333333333',
    } as unknown as Parameters<typeof MarketCard>[0]['account'];
    render(<MarketCard pod={pod} account={account} />);
    const buttons = screen.getAllByRole('button', { name: /Vote (Yes|No)/ });
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
  });
});
