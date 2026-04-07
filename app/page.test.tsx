import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './page';

vi.mock('wagmi', () => ({
  useAccount: () => ({ address: undefined }),
  useChainId: () => 84532,
  useSwitchChain: () => ({ switchChain: vi.fn() }),
}));

vi.mock('@coinbase/onchainkit', () => ({
  OnchainKitProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@coinbase/onchainkit/identity', () => ({
  Address: () => null,
  Avatar: () => null,
  EthBalance: () => null,
  Identity: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Name: () => null,
}));

vi.mock('@coinbase/onchainkit/wallet', () => ({
  ConnectWallet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Wallet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  WalletDropdown: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  WalletDropdownDisconnect: () => null,
  WalletDropdownLink: () => null,
}));

describe('App (empty POD_MARKETS)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders the empty state when POD_MARKETS is empty', () => {
    render(<App />);
    expect(screen.getByText('Prediction Market Aggregator')).toBeInTheDocument();
    expect(screen.getByText(/No markets configured yet/)).toBeInTheDocument();
    expect(screen.getByText('lib/podConfig.ts')).toBeInTheDocument();
  });
});

describe('App (with POD_MARKETS entries)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders stub market cards when POD_MARKETS has entries', async () => {
    vi.doMock('@/lib/podConfig', () => ({
      POD_MARKETS: [
        {
          owner: 'TestAlice',
          marketAddress: '0x1111111111111111111111111111111111111111',
          tokenAddress: '0x2222222222222222222222222222222222222222',
        },
        {
          owner: 'TestBob',
          marketAddress: '0x3333333333333333333333333333333333333333',
          tokenAddress: '0x4444444444444444444444444444444444444444',
        },
      ],
    }));

    const { default: AppWithMarkets } = await import('./page');
    render(<AppWithMarkets />);

    expect(screen.getByText("TestAlice's Market")).toBeInTheDocument();
    expect(screen.getByText("TestBob's Market")).toBeInTheDocument();
    expect(screen.getAllByText('components/MarketCard.tsx')).toHaveLength(2);
  });
});
