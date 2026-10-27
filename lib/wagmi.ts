import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { baseAccount, injected } from 'wagmi/connectors';

// Base Sepolia only: this workshop never touches mainnet.
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    baseAccount({ appName: 'NEO Prediction Markets' }),
    injected(),
  ],
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
