// Backup buyer: pays your x402 endpoint from a local dev wallet, no agent needed.
// Usage: npm run buy -- https://<your-app>.vercel.app/api/markets
// Needs BUYER_PRIVATE_KEY (a Base Sepolia wallet holding test USDC) in .env.local.
import { readFileSync } from 'node:fs';
import { wrapFetchWithPaymentFromConfig, decodePaymentResponseHeader } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm';
import { privateKeyToAccount } from 'viem/accounts';

function loadEnv() {
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {
    // no .env.local: rely on the shell environment
  }
}

async function main() {
  loadEnv();
  const url = process.argv[2];
  const key = process.env.BUYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!url) throw new Error('Pass the endpoint URL: npm run buy -- https://.../api/markets');
  if (!key?.startsWith('0x')) throw new Error('Set BUYER_PRIVATE_KEY=0x... in .env.local');

  const account = privateKeyToAccount(key as `0x${string}`);
  console.log(`Buyer wallet: ${account.address}`);

  const unpaid = await fetch(url);
  console.log(`Without payment: HTTP ${unpaid.status}`);

  // Enforced cap: the client refuses to sign any payment above $0.01.
  // The prompt or the URL is never the security boundary; this is.
  const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [{ network: 'eip155:84532', client: new ExactEvmScheme(account) }],
    spendControls: { maxAmountPerPayment: '$0.01' },
  });

  const paid = await fetchWithPayment(url);
  console.log(`With payment: HTTP ${paid.status}`);
  if (paid.status === 402) {
    const required = paid.headers.get('PAYMENT-REQUIRED');
    const reason = required ? JSON.parse(Buffer.from(required, 'base64').toString()).error : 'unknown';
    throw new Error(`Payment was rejected: ${reason}. Does the buyer wallet hold test USDC on Base Sepolia?`);
  }
  const header = paid.headers.get('PAYMENT-RESPONSE') || paid.headers.get('X-PAYMENT-RESPONSE');
  if (header) {
    const settlement = decodePaymentResponseHeader(header);
    console.log('Settlement:', settlement);
    if (settlement.transaction) {
      console.log(`https://sepolia.basescan.org/tx/${settlement.transaction}`);
    }
  }
  console.log(JSON.stringify(await paid.json(), null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
