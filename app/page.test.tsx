import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// The page is tested on its own. MarketCard and podConfig are mocked so these
// tests keep passing after you build the card and fill in your pod's addresses.
vi.mock('wagmi', () => ({
  useConnection: () => ({ address: undefined, isConnected: false }),
  useChainId: () => 84532,
  useSwitchChain: () => ({ switchChain: vi.fn() }),
}));

vi.mock('@/components/WalletBar', () => ({
  WalletBar: () => null,
}));

const TWO_MARKETS = [
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
];

async function loadApp(markets: typeof TWO_MARKETS, card: 'stub' | 'built' | 'voting') {
  vi.doMock('@/lib/podConfig', () => ({ POD_MARKETS: markets }));
  vi.doMock('@/components/MarketCard', () => ({
    MarketCard: ({ pod }: { pod: { owner: string } }) => (
      <div data-market-stub={card === 'stub' ? '' : undefined}>
        {pod.owner}&apos;s Market
        {card === 'voting' && <button data-vote-button>Vote Yes</button>}
      </div>
    ),
  }));
  const { default: App } = await import('./page');
  return App;
}

describe('App', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 501 })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('@/lib/podConfig');
    vi.doUnmock('@/components/MarketCard');
  });

  it('renders the setup checklist when POD_MARKETS is empty', async () => {
    const App = await loadApp([], 'stub');
    render(<App />);
    expect(screen.getByText('🔮 Prediction Market Aggregator')).toBeInTheDocument();
    expect(screen.getByText(/isn't wired up yet/)).toBeInTheDocument();
    expect(screen.getByText('lib/podConfig.ts')).toBeInTheDocument();
    expect(screen.getByText('App running')).toBeInTheDocument();
  });

  it('renders one card per POD_MARKETS entry', async () => {
    const App = await loadApp(TWO_MARKETS, 'stub');
    render(<App />);
    expect(screen.getByText(/TestAlice/)).toBeInTheDocument();
    expect(screen.getByText(/TestBob/)).toBeInTheDocument();
    expect(screen.getByText(/Workshop Progress — 2\/5/)).toBeInTheDocument();
  });

  it('counts the API route as done for 200 and for a 402 from x402', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 402 })));
    const App = await loadApp(TWO_MARKETS, 'stub');
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Workshop Progress — 3\/5/)).toBeInTheDocument());
  });

  it('ticks the card and voting items once cards render real data and vote buttons', async () => {
    const App = await loadApp(TWO_MARKETS, 'voting');
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Workshop Progress — 4\/5/)).toBeInTheDocument());
  });
});
