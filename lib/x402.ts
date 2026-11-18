import { HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { x402ResourceServer } from '@x402/next';

// Base Sepolia in CAIP-2 form. Testnet only.
export const X402_NETWORK = 'eip155:84532' as const;

// The public x402.org facilitator verifies and settles Base Sepolia payments
// without an API key. Production apps on mainnet use the CDP facilitator instead.
const facilitator = new HTTPFacilitatorClient({
  url: process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator',
});

export const x402Server = new x402ResourceServer(facilitator).register(
  X402_NETWORK,
  new ExactEvmScheme(),
);

/** The wallet that receives payments. Server-side only: never NEXT_PUBLIC_. */
export function payTo(): `0x${string}` {
  const address = process.env.X402_PAY_TO;
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error('Set X402_PAY_TO in .env.local to the address that should receive payments.');
  }
  return address as `0x${string}`;
}
