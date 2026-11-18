import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function completeApp(root, marketAddress, tokenAddress) {
  const write = (file, text) => writeFile(path.join(root, file), text);
  await write('lib/podConfig.ts', `export type PodMarket = { owner: string; marketAddress: \`0x\${string}\`; tokenAddress: \`0x\${string}\` };
export const POD_MARKETS: PodMarket[] = [{ owner: 'Synthetic pod', marketAddress: '${marketAddress}', tokenAddress: '${tokenAddress}' }];\n`);
  await write('app/api/markets/route.ts', `import { NextResponse } from 'next/server';
import { createPublicClient, http, formatEther } from 'viem';
import { anvil } from 'viem/chains';
import { POD_MARKETS } from '@/lib/podConfig';
import { PredictionMarketABI } from '@/lib/contracts';
const client = createPublicClient({ chain: anvil, transport: http(process.env.BASE_SEPOLIA_RPC) });
export async function GET() {
  try {
    return NextResponse.json(await Promise.all(POD_MARKETS.map(async (pod) => {
      const [question, yesPool, noPool, resolved] = await client.readContract({ address: pod.marketAddress, abi: PredictionMarketABI, functionName: 'markets', args: [0n] });
      return { ...pod, question, yesPool: formatEther(yesPool), noPool: formatEther(noPool), resolved };
    })));
  } catch { return NextResponse.json({ error: 'Contract read failed' }, { status: 500 }); }
}\n`);
  // Preserve the starter layout, replacing only the exercise seams.
  let card = await readFile(path.join(root, 'components/MarketCard.tsx'), 'utf8');
  card = card.replace("import type { useConnection } from 'wagmi';", `import { useConnection, useReadContracts, useSendCalls, useWaitForCallsStatus } from 'wagmi';
import { useEffect, useRef } from 'react';
import { PredictionMarketABI } from '@/lib/contracts';
import { buildVoteCalls } from '@/lib/voteCalls';`);
  const start = card.indexOf('  // TODO (Task 2): read');
  const end = card.indexOf('  return (', start);
  if (start < 0 || end < 0) throw new Error('MarketCard TODO seam changed');
  card = card.slice(0, start) + `  const marketRead = { address: pod.marketAddress, abi: PredictionMarketABI, functionName: 'markets', args: [0n] } as const;
  const contracts = account.address
    ? [marketRead, { address: pod.marketAddress, abi: PredictionMarketABI, functionName: 'amountVoted', args: [0n, account.address] }] as const
    : [marketRead] as const;
  const { data, refetch } = useReadContracts<typeof contracts>({ contracts });
  const market = data?.[0]?.result;
  const [question, yesPool, noPool, resolved] = market ?? ['Loading...', 0n, 0n, false];
  const userStake = data?.[1]?.result ?? 0n;
  const total = yesPool + noPool;
  const yesPercent = total ? Number(yesPool * 100n / total) : 50;
  const noPercent = 100 - yesPercent;
  const { mutate: sendCalls, data: sent, isPending, error } = useSendCalls();
  const { data: status, error: statusError } = useWaitForCallsStatus({ id: sent?.id, pollingInterval: 100, query: { enabled: !!sent?.id } });
  const refreshed = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (status?.status === 'success' && sent?.id && refreshed.current !== sent.id) {
      refreshed.current = sent.id;
      void refetch();
    }
  }, [status?.status, sent?.id, refetch]);
  const busy = isPending || (!!sent && !error && !statusError && status?.status !== 'success' && status?.status !== 'failure');
  const message = error || statusError ? 'Vote request failed' : isPending ? 'Signing' : status?.status === 'success' ? 'Vote confirmed' : status?.status === 'failure' ? 'Vote failed' : busy ? 'Pending' : '';

` + card.slice(end);
  card = card.replace('      data-market-stub', '      data-market-stub={!market || undefined}\n      data-connected-reads-ready={(!!account.address && !!market && data?.[1]?.status === "success") || undefined}');
  card = card.replace('      {resolved ? (', '      <p role="status">{message}</p>\n      {resolved ? (');
  for (const side of ['true', 'false']) {
    card = card.replace('              disabled\n', `              data-vote-button\n              disabled={!market || busy || resolved || account.chainId !== 31337}\n              onClick={() => sendCalls({ calls: buildVoteCalls(pod, ${side}), experimental_fallback: true })}\n`);
  }
  await write('components/MarketCard.tsx', card);
  for (const file of ['app/page.tsx', 'lib/wagmi.ts']) {
    let text = await readFile(path.join(root, file), 'utf8');
    text = text.replace("{ baseSepolia }", "{ anvil as baseSepolia }");
    await write(file, text);
  }
  // Anvil has no canonical Multicall3.
  // useReadContracts still exercises its real individual-read fallback.
  await write('next.config.mjs', `const config = { distDir: '.next-e2e' };\nexport default config;\n`);
}
