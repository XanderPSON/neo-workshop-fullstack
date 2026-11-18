import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Base Sepolia only: this workshop never touches mainnet.
// Browser wallet only (the Coinbase Wallet extension from Setup). The Base Account sign-in
// is left out on purpose: a newly created Base Account connects but cannot send on Base
// Sepolia ("This chain is not supported", github.com/base/account-sdk/issues/363).
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'),
  },
  ssr: true,
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
