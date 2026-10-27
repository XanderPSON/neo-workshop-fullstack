// Backup buyer: pays your x402 endpoint from a local dev wallet, no agent needed.
// Usage: npm run buy -- https://<your-app>.vercel.app/api/markets [--max-payment 0.005]
// Needs BUYER_PRIVATE_KEY (a Base Sepolia wallet holding test USDC) in .env.local.
// --max-payment is the enforced per-payment cap in USD (default 0.01, never above 0.01).
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

// The lab's hard ceiling. --max-payment can lower the cap, never raise it.
const LAB_CEILING_USD = 0.01;

function parseMaxPayment(raw: string | undefined): string {
  if (raw === undefined) return '0.01';
  const value = raw.replace(/^\$/, '');
  if (!/^\d+(\.\d{1,6})?$/.test(value) || Number(value) <= 0 || Number(value) > LAB_CEILING_USD) {
    throw new Error(
      `--max-payment must be a USD amount above 0 and at most ${LAB_CEILING_USD} (for example 0.005); got ${JSON.stringify(raw)}`,
    );
  }
  return value;
}

function parseArgs(argv: string[]) {
  let url: string | undefined;
  let maxPayment: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--max-payment') {
      maxPayment = argv[++i];
      if (maxPayment === undefined) throw new Error('--max-payment needs a value, for example --max-payment 0.005');
    } else if (arg.startsWith('--max-payment=')) {
      maxPayment = arg.slice('--max-payment='.length);
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option ${arg}. Usage: npm run buy -- <url> [--max-payment 0.005]`);
    } else {
      url = arg;
    }
  }
  return { url, maxPayment: parseMaxPayment(maxPayment) };
}

async function main() {
  loadEnv();
  const { url, maxPayment } = parseArgs(process.argv.slice(2));
  const key = process.env.BUYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!url) throw new Error('Pass the endpoint URL: npm run buy -- https://.../api/markets');
  if (!key?.startsWith('0x')) throw new Error('Set BUYER_PRIVATE_KEY=0x... in .env.local');

  const account = privateKeyToAccount(key as `0x${string}`);
  console.log(`Buyer wallet: ${account.address}`);
  console.log(`Spend cap: $${maxPayment} per payment (enforced by the x402 client)`);

  const unpaid = await fetch(url);
  console.log(`Without payment: HTTP ${unpaid.status}`);

  // Enforced cap: the client refuses to sign any payment above maxPayment.
  // The prompt or the URL is never the security boundary; this is.
  const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [{ network: 'eip155:84532', client: new ExactEvmScheme(account) }],
    spendControls: { maxAmountPerPayment: `$${maxPayment}` },
  });

  let paid: Response;
  try {
    paid = await fetchWithPayment(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('spendControls')) {
      // The guardrail working is not an error: report it and exit cleanly.
      console.log(`Refused: the price is above your $${maxPayment} cap. Nothing was signed or paid.`);
      return;
    }
    throw err;
  }
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
