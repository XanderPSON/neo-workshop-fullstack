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

  it('renders market cards when POD_MARKETS has entries', async () => {
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
    expect(screen.getAllByText('Loading...')).toHaveLength(2);
    expect(screen.getAllByText('Yes 50%')).toHaveLength(2);
    expect(screen.getAllByText('No 50%')).toHaveLength(2);
  });

  it('shows disabled vote buttons with placeholder text', async () => {
    vi.doMock('wagmi', () => ({
      useAccount: () => ({ address: '0xdeadbeef' }),
      useChainId: () => 84532,
      useSwitchChain: () => ({ switchChain: vi.fn() }),
    }));

    vi.doMock('@/lib/podConfig', () => ({
      POD_MARKETS: [
        {
          owner: 'TestAlice',
          marketAddress: '0x1111111111111111111111111111111111111111',
          tokenAddress: '0x2222222222222222222222222222222222222222',
        },
      ],
    }));

    const { default: AppWithMarkets } = await import('./page');
    render(<AppWithMarkets />);

    const yesButton = screen.getByText('Vote Yes (10 Tokens)');
    const noButton = screen.getByText('Vote No (10 Tokens)');
    expect(yesButton).toBeDisabled();
    expect(noButton).toBeDisabled();
  });
});
