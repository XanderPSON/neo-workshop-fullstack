import { afterEach, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { completeApp } from './complete-app.mjs';

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map((p) => rm(p, { recursive: true, force: true }))); });

it('keeps normal app setup RPC-only without wallet-secret placeholders', async () => {
  const sample = await readFile('.env.local.example', 'utf8');
  const keys = sample.split('\n').filter((line) => /^[A-Z_]+=/.test(line)).map((line) => line.split('=')[0]);
  expect(keys).toEqual(['BASE_SEPOLIA_RPC', 'NEXT_PUBLIC_RPC_URL']);
  expect(sample).not.toContain('PRIVATE_KEY');
});

it('requires an explicit contracts checkout before allocating any resources', () => {
  const result = spawnSync(process.execPath, ['scripts/e2e/run.mjs'], { encoding: 'utf8' });
  expect(result.status).toBe(2);
  expect(result.stderr).toContain('--contracts');
  expect(result.stdout).not.toContain('Evidence:');
});

it('retains a failed-run report and reaps owned processes when fixture preparation fails', async () => {
  const result = spawnSync(process.execPath, ['scripts/e2e/run.mjs', '--contracts', '/nonexistent/neo-contracts'], { encoding: 'utf8' });
  expect(result.status).toBe(1);
  const work = result.stdout.match(/Evidence: (.+)/)?.[1];
  expect(work).toBeTruthy();
  roots.push(work!);
  const report = JSON.parse(await readFile(path.join(work!, 'report.json'), 'utf8'));
  expect(report.passed).toBe(false);
  expect(report.cleanup).toBe(true);
  expect(report.error).toContain('prepare-contracts failed');
});

it('completes only a disposable app while preserving the learner card and vote helper', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'neo-fixture-test-'));
  roots.push(root);
  for (const dir of ['app/api/markets', 'components', 'lib']) await mkdir(path.join(root, dir), { recursive: true });
  const originals = new Map<string, string>();
  for (const file of ['app/page.tsx', 'lib/wagmi.ts', 'components/MarketCard.tsx', 'lib/voteCalls.ts']) {
    const value = await readFile(file, 'utf8');
    originals.set(file, value);
    await writeFile(path.join(root, file), value);
  }
  const market = '0x0000000000000000000000000000000000000001';
  const token = '0x0000000000000000000000000000000000000002';
  await completeApp(root, market, token);
  const card = await readFile(path.join(root, 'components/MarketCard.tsx'), 'utf8');
  expect(card).toContain('useReadContracts<typeof contracts>');
  expect(card).toContain('buildVoteCalls(pod, true)');
  expect(card).toContain('buildVoteCalls(pod, false)');
  expect(card).toContain('experimental_fallback: true');
  expect(card).toContain('account.chainId !== 31337');
  expect(await readFile(path.join(root, 'lib/podConfig.ts'), 'utf8')).toContain(market);
  expect(await readFile(path.join(root, 'next.config.mjs'), 'utf8')).toContain('.next-e2e');
  for (const [file, value] of originals) expect(await readFile(file, 'utf8')).toBe(value);
  expect(await readFile(path.join(root, 'lib/voteCalls.ts'), 'utf8')).toBe(originals.get('lib/voteCalls.ts'));
});

it('fails visibly when the learner fixture seam changes', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'neo-fixture-drift-'));
  roots.push(root);
  for (const dir of ['app/api/markets', 'components', 'lib']) await mkdir(path.join(root, dir), { recursive: true });
  await writeFile(path.join(root, 'components/MarketCard.tsx'), 'changed scaffold');
  await expect(completeApp(root, '0x01', '0x02')).rejects.toThrow('TODO seam changed');
});
