// Day 2 preflight: run `npm run preflight` before the session starts.
// Checks your machine, env, Base Sepolia, and the x402 facilitator. Read-only: sends nothing.
import { existsSync, readFileSync } from 'node:fs';
import { createPublicClient, formatEther, formatUnits, http, isAddress, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
let failures = 0;
const ok = (msg: string) => console.log(`  ✅ ${msg}`);
const warn = (msg: string) => console.log(`  ⚠️  ${msg}`);
const fail = (msg: string) => {
  failures++;
  console.log(`  ❌ ${msg}`);
};

function loadEnv() {
  if (!existsSync('.env.local')) return false;
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
  return true;
}

async function main() {
  console.log('\nNEO Day 2 preflight\n');

  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 22) ok(`Node ${process.versions.node}`);
  else fail(`Node ${process.versions.node}: install Node 22 or newer (nvm install 22)`);

  if (existsSync('node_modules/next')) ok('Dependencies installed');
  else fail('Run npm install');

  if (loadEnv()) ok('.env.local found');
  else fail('Missing .env.local: cp .env.local.example .env.local');

  const rpc = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
  const client = createPublicClient({ chain: baseSepolia, transport: http(rpc) });
  try {
    const id = await client.getChainId();
    if (id === 84532) ok(`Base Sepolia RPC reachable (${rpc})`);
    else fail(`RPC ${rpc} is chain ${id}, expected 84532 (Base Sepolia)`);
  } catch {
    fail(`Cannot reach RPC ${rpc}`);
  }

  const payTo = process.env.X402_PAY_TO;
  if (payTo && isAddress(payTo)) {
    ok(`X402_PAY_TO = ${payTo}`);
  } else {
    warn('X402_PAY_TO not set yet (needed for Part 4, the x402 lab)');
  }

  try {
    const res = await fetch(`${process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator'}/supported`);
    const body = (await res.json()) as { kinds?: Array<{ network: string; scheme: string }> };
    if (body.kinds?.some((k) => k.network === 'eip155:84532' && k.scheme === 'exact')) {
      ok('x402 facilitator supports Base Sepolia');
    } else {
      fail('x402 facilitator does not list eip155:84532 exact: tell a facilitator');
    }
  } catch {
    fail('Cannot reach the x402 facilitator: tell a facilitator');
  }

  const key = process.env.BUYER_PRIVATE_KEY;
  if (key && /^0x[0-9a-fA-F]{64}$/.test(key)) {
    const buyer = privateKeyToAccount(key as `0x${string}`).address;
    const [eth, usdc] = await Promise.all([
      client.getBalance({ address: buyer }),
      client.readContract({
        address: USDC,
        abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
        functionName: 'balanceOf',
        args: [buyer],
      }),
    ]);
    const line = `Backup buyer ${buyer}: ${formatEther(eth)} ETH, ${formatUnits(usdc, 6)} USDC`;
    if (usdc >= 10_000n) ok(line);
    else warn(`${line} (needs >= 0.01 test USDC for npm run buy)`);
  } else {
    warn('BUYER_PRIVATE_KEY not set (only needed for the backup buyer)');
  }

  console.log(failures ? `\n${failures} problem(s) to fix before the session.\n` : '\nAll set. See you on Day 2.\n');
  process.exit(failures ? 1 : 0);
}

void main();
