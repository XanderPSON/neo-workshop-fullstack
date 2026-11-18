#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, mkdtemp, readFile, writeFile, cp, symlink, open } from 'node:fs/promises';
import { createPublicClient, createWalletClient, http, parseEther, decodeFunctionData } from 'viem';
import { anvil } from 'viem/chains';
import { completeApp } from './complete-app.mjs';
import { installSignalCleanup } from './signals.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--contracts') {
  console.error('Usage: npm run test:e2e -- --contracts /absolute/path/to/neo-workshop-smart-contracts');
  process.exit(2);
}
const contractsSource = path.resolve(args[1]);
const work = await mkdtemp(path.join(tmpdir(), 'neo-e2e-'));
const app = path.join(work, 'app');
const contracts = path.join(work, 'contracts');
const children = [];
let browser;
const report = { passed: false, scope: 'LOCAL Anvil31337 + synthetic provider; NOT Wallet MCP or Base Sepolia', work, checks: [], receipts: [], processes: [] };
console.log(`Evidence: ${work}`);
// Deliberately do not inherit RPCs, wallet variables, NODE_OPTIONS or project .env.
const env = { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: tmpdir(), CI: '1', NEXT_TELEMETRY_DISABLED: '1' };
Object.assign(env, { FOUNDRY_FUZZ_SEED: '0x42', FOUNDRY_FUZZ_RUNS: '256', NO_COLOR: '1' });
// Preserve corporate CA trust without weakening TLS verification.
for (const key of ['NODE_EXTRA_CA_CERTS', 'SSL_CERT_FILE', 'NPM_CONFIG_CAFILE']) {
  if (process.env[key]) env[key] = process.env[key];
}
const json = (value) => JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2);
let saves = Promise.resolve();
async function save(name, value) {
  saves = saves.then(() => writeFile(path.join(work, name), typeof value === 'string' ? value : json(value)));
  await saves;
}
async function check(name, action) {
  if (report.interrupted) throw new Error('Rehearsal interrupted');
  const result = await action();
  if (report.interrupted) throw new Error('Rehearsal interrupted');
  report.checks.push(name);
  await save('report.json', report);
  console.log(`PASS ${name}`);
  return result;
}
async function port() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const value = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  assert.notEqual(value, 3000);
  return value;
}
async function start(command, argv, cwd, name, extra = {}) {
  if (report.interrupted) throw new Error('Rehearsal interrupted');
  const log = await open(path.join(work, `${name}.log`), 'w');
  if (report.interrupted) { await log.close(); throw new Error('Rehearsal interrupted'); }
  const child = spawn(command, argv, { cwd, env: { ...env, ...extra }, stdio: ['ignore', log.fd, log.fd], detached: true });
  child.done = new Promise((resolve) => {
    child.once('exit', (code) => resolve(code));
    child.once('error', (error) => { child.spawnError = error; resolve(-1); });
  });
  children.push(child);
  report.processes.push({ name, pid: child.pid });
  await log.close();
  return child;
}
async function stop(child) {
  if (!child.pid) return;
  try { process.kill(-child.pid, 'SIGTERM'); } catch (e) { if (e.code !== 'ESRCH') throw e; }
  let timer;
  try { await Promise.race([child.done, new Promise((resolve) => { timer = setTimeout(resolve, 3000); })]); }
  finally { clearTimeout(timer); }
  try { process.kill(-child.pid, 'SIGKILL'); } catch (e) { if (e.code !== 'ESRCH') throw e; }
  await child.done;
}
async function run(command, argv, cwd, name, extra) {
  const child = await start(command, argv, cwd, name, extra);
  const timer = setTimeout(() => { void stop(child); }, 240000);
  try {
    const code = await child.done;
    if (code !== 0) throw new Error(`${name} failed (${code}); inspect ${name}.log`);
  } finally { clearTimeout(timer); }
}
async function ready(child, probe, name) {
  const until = Date.now() + 90000;
  while (Date.now() < until) {
    if (child.spawnError) throw child.spawnError;
    if (child.exitCode !== null || child.signalCode) throw new Error(`${name} exited; inspect ${name}.log`);
    try { if (await probe()) return; } catch { /* bounded readiness, not a fixed startup sleep */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`${name} readiness timed out`);
}
async function snapshot(source, target, dirs) {
  // Copy an explicit allowlist: only the public .example, never actual env/keystore files.
  await mkdir(target, { recursive: true });
  for (const file of dirs) await cp(path.join(source, file), path.join(target, file), { recursive: true, dereference: true });
}
let cleanupPromise;
function cleanup() {
  cleanupPromise ??= (async () => {
    try { await browser?.close(); } catch { /* still reap every owned process */ }
    for (const child of [...children].reverse()) {
      try { await stop(child); } catch (error) {
        (report.cleanupErrors ??= []).push({ pid: child.pid, error: error.message });
      }
    }
    report.cleanup = !report.cleanupErrors?.length && children.every((c) => {
      if (!c.pid) return true;
      try { process.kill(-c.pid, 0); return false; } catch (error) { return error.code === 'ESRCH'; }
    });
    await save('report.json', report);
  })();
  return cleanupPromise;
}
installSignalCleanup({ cleanup, onInterrupt: (signal) => { report.interrupted = signal; } });

try {
  await snapshot(root, app, ['app', 'components', 'lib', 'scripts', '.env.local.example', 'package.json', 'package-lock.json', 'postcss.config.mjs', 'tailwind.config.ts', 'tsconfig.json', 'next-env.d.ts', 'eslint.config.mjs', 'vitest.config.ts', 'vitest.setup.ts']);
  await symlink(path.join(root, 'node_modules'), path.join(app, 'node_modules'), 'dir');
  await run('python3', [path.join(contractsSource, 'script/prepare-instructor.py'), contracts], work, 'prepare-contracts');
  report.sources = {
    fullstack: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    contracts: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: contractsSource, encoding: 'utf8' }).trim(),
    contractsStatus: execFileSync('git', ['status', '--short'], { cwd: contractsSource, encoding: 'utf8' }).trim(),
    harnessHash: createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).digest('hex'),
    appFixtureHash: createHash('sha256').update(await readFile(path.join(root, 'scripts/e2e/complete-app.mjs'))).digest('hex'),
    signalHandlerHash: createHash('sha256').update(await readFile(path.join(root, 'scripts/e2e/signals.mjs'))).digest('hex'),
    contractHelperHash: createHash('sha256').update(await readFile(path.join(contractsSource, 'script/verify_workshop.py'))).digest('hex'),
  };
  await check('Completed copied contract exercises pass original tests', () => run('forge', ['test', '-vv'], contracts, 'contracts-tests'));
  const rpcPort = await port();
  const appPort = await port();
  const rpc = `http://127.0.0.1:${rpcPort}`;
  const url = `http://127.0.0.1:${appPort}`;
  report.rpc = rpc; report.url = url;
  const node = await start('anvil', ['--host', '127.0.0.1', '--port', String(rpcPort), '--chain-id', '31337', '--silent'], work, 'anvil');
  const client = createPublicClient({ chain: anvil, transport: http(rpc), pollingInterval: 100 });
  await ready(node, async () => await client.getChainId() === 31337, 'anvil');
  const accounts = await client.request({ method: 'eth_accounts' });
  const [owner, voter, recipient] = accounts;
  const wallet = (account) => createWalletClient({ account, chain: anvil, transport: http(rpc) });
  async function receipt(label, hash) {
    const result = await client.waitForTransactionReceipt({ hash });
    assert.equal(result.status, 'success', label);
    report.receipts.push({ label, hash, blockNumber: result.blockNumber, status: result.status });
    return result;
  }
  async function artifact(file) {
    // Reference contracts can share artifact basenames. Always qualify src.
    const qualified = `src/${file}.sol:${file}`;
    const inspect = (field) => execFileSync('forge', ['inspect', qualified, field, '--json'], { cwd: contracts, env, encoding: 'utf8', timeout: 30000 });
    return { abi: JSON.parse(inspect('abi')), bytecode: { object: inspect('bytecode').trim() } };
  }
  const tokenArtifact = await artifact('MyToken');
  const marketArtifact = await artifact('PredictionMarketV2');
  const v1Artifact = await artifact('PredictionMarket');
  async function deploy(name, artifact, args = []) {
    const r = await receipt(name, await wallet(owner).deployContract({ abi: artifact.abi, bytecode: artifact.bytecode.object, args }));
    return r.contractAddress;
  }
  const token = await deploy('Deploy token', tokenArtifact);
  const market = await deploy('Deploy V2', marketArtifact, [owner, token]);
  const v1 = await deploy('Deploy V1', v1Artifact, [owner]);
  const read = (address, abi, functionName, args = []) => client.readContract({ address, abi, functionName, args });
  const tx = async (label, account, address, abi, functionName, args, value) => receipt(label, await wallet(account).writeContract({ address, abi, functionName, args, ...(value ? { value } : {}) }));
  const t = (name, args) => read(token, tokenArtifact.abi, name, args);
  const m = (name, args) => read(market, marketArtifact.abi, name, args);
  await check('Part1 V1 deployed, repeat ETH votes accumulate, resolution closes market', async () => {
    await tx('V1 create', owner, v1, v1Artifact.abi, 'createMarket', ['Local V1']);
    for (let i = 0; i < 2; i++) await tx('V1 vote', voter, v1, v1Artifact.abi, 'vote', [0n, true], parseEther('0.001'));
    assert.equal((await read(v1, v1Artifact.abi, 'markets', [0n]))[1], parseEther('0.002'));
    await tx('V1 resolve', owner, v1, v1Artifact.abi, 'resolveMarket', [0n, true]);
    assert.equal((await read(v1, v1Artifact.abi, 'markets', [0n]))[3], true);
  });
  await tx('V2 create', owner, market, marketArtifact.abi, 'createMarket', ['Will local E2E pass?']);
  await tx('Fund browser voter', owner, token, tokenArtifact.abi, 'transfer', [voter, parseEther('30')]);
  assert.equal(await t('decimals'), 18);
  assert.equal((await m('token')).toLowerCase(), token.toLowerCase());
  await check('EVM simulation rejects missing allowance', async () => {
    await assert.rejects(() => client.simulateContract({ account: voter, address: market, abi: marketArtifact.abi, functionName: 'vote', args: [0n, true, parseEther('10')] }), /InsufficientAllowance/);
    assert.equal((await m('markets', [0n]))[1], 0n);
  });
  await check('EVM simulation rejects insufficient token balance', async () => {
    await tx('Empty recipient approve', recipient, token, tokenArtifact.abi, 'approve', [market, parseEther('10')]);
    await assert.rejects(() => client.simulateContract({ account: recipient, address: market, abi: [...marketArtifact.abi, ...tokenArtifact.abi.filter((entry) => entry.type === 'error')], functionName: 'vote', args: [0n, true, parseEther('10')] }), /InsufficientBalance/);
    assert.equal(await m('amountVoted', [0n, recipient]), 0n);
    await tx('Clear simulation-only recipient allowance', recipient, token, tokenArtifact.abi, 'approve', [market, 0n]);
    assert.equal(await t('allowance', [recipient, market]), 0n);
  });
  await completeApp(app, market, token);
  const appEnv = { BASE_SEPOLIA_RPC: rpc, NEXT_PUBLIC_RPC_URL: rpc };
  await check('Full learner npm test after disposable card completion (including instructor safety tests)', () => run('npm', ['test'], app, 'app-tests', appEnv));
  await check('Completed app lint', () => run('npm', ['run', 'lint'], app, 'lint', appEnv));
  await check('Completed app typecheck', () => run(path.join(root, 'node_modules/.bin/tsc'), ['--noEmit'], app, 'typecheck', appEnv));
  await check('Isolated production build', () => run('npm', ['run', 'build', '--', '--webpack'], app, 'build', appEnv));
  const server = await start(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(appPort)], app, 'next', appEnv);
  await ready(server, async () => (await fetch(`${url}/api/markets`, { signal: AbortSignal.timeout(2000) })).status === 200, 'next');
  async function apiPools(yes, no) {
    const response = await fetch(`${url}/api/markets`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body[0].question, 'Will local E2E pass?');
    assert.equal(body[0].yesPool, yes); assert.equal(body[0].noPool, no);
    await save(`api-${yes}-${no}.json`, body);
  }
  await check('API reads deployed empty market', () => apiPools('0', '0'));
  const tools = path.join(tmpdir(), 'neo-e2e-tools-1.65.1');
  await mkdir(tools, { recursive: true });
  const require = createRequire(path.join(tools, 'package.json'));
  try { require.resolve('playwright'); } catch { await run('npm', ['install', '--prefix', tools, '--no-save', '--package-lock=false', '--ignore-scripts', 'playwright@1.65.1'], work, 'browser-tools'); }
  assert.equal(require('playwright/package.json').version, '1.65.1', 'pinned browser tooling');
  await run(process.execPath, [path.join(path.dirname(require.resolve('playwright/package.json')), 'cli.js'), 'install', 'chromium'], work, 'browser-install');
  const { chromium } = require('playwright');
  // The runner owns shutdown. Playwright's default SIGINT handler exits early.
  browser = await chromium.launch({ headless: true, handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false });
  const browserHashes = [];
  const switches = [];
  async function pageFor(account, wrongNetwork = false) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    // Deny browser egress; only this app and its owned chain are reachable.
    await context.route('**/*', (route) => {
      const origin = new URL(route.request().url()).origin;
      return [url, rpc].includes(origin) ? route.continue() : route.abort();
    });
    await context.exposeBinding('localRpc', async (_, method, params) => {
      assert.ok(['eth_', 'net_', 'web3_'].some((p) => method.startsWith(p)), 'RPC method allowlist');
      if (method === 'eth_sendTransaction') {
        assert.equal(params[0].from.toLowerCase(), account.toLowerCase());
        assert.ok([token, market].some((a) => a.toLowerCase() === params[0].to.toLowerCase()));
      }
      const value = await client.request({ method, params });
      if (method === 'eth_sendTransaction') browserHashes.push(value);
      return value;
    });
    await context.exposeBinding('recordSwitch', (_, id) => switches.push(id));
    await context.addInitScript(({ account, wrongNetwork }) => {
      let chainId = wrongNetwork ? '0x1' : '0x7a69';
      const listeners = {};
      window.__requests = [];
      function assertLocalChain(id) { if (id !== '0x7a69') throw new Error('Synthetic provider only permits the local chain'); }
      window.ethereum = {
        on: (event, cb) => (listeners[event] ??= []).push(cb),
        removeListener: (event, cb) => { listeners[event] = (listeners[event] ?? []).filter((l) => l !== cb); },
        request: async ({ method, params = [] }) => {
          window.__requests.push(method);
          if (method === 'eth_accounts' || method === 'eth_requestAccounts') return [account];
          if (method === 'eth_chainId') return chainId;
          if (method === 'wallet_switchEthereumChain') {
            await window.recordSwitch(params[0].chainId);
            assertLocalChain(params[0].chainId);
            chainId = params[0].chainId;
            for (const cb of listeners.chainChanged ?? []) cb(chainId);
            return null;
          }
          if (method.startsWith('wallet_')) throw Object.assign(new Error('Unsupported synthetic wallet method'), { code: -32601 });
          if (method === 'eth_sendTransaction' && chainId !== '0x7a69') throw new Error('Wrong network: sends forbidden');
          return window.localRpc(method, params);
        },
      };
    }, { account, wrongNetwork });
    return { context, page: await context.newPage() };
  }
  async function text(page, value) { await page.getByText(value, { exact: true }).waitFor({ state: 'visible', timeout: 30000 }); }
  await check('Instructor chain guard disables settled reads on wrong chain and enables same-page local-chain control', async () => {
    const { context, page } = await pageFor(voter, true);
    await page.goto(url);
    await text(page, 'Will local E2E pass?');
    await page.getByRole('button', { name: 'Browser wallet', exact: true }).click();
    await page.waitForFunction(() => document.body.textContent.includes('Disconnect'));
    await page.locator('[data-vote-button]').first().waitFor();
    assert.equal(await page.locator('[data-vote-button]').count(), 2);
    await page.locator('[data-connected-reads-ready="true"]').waitFor();
    await text(page, 'Will local E2E pass?');
    assert.equal(await page.locator('[data-market-stub]').count(), 0);
    assert.equal(await page.getByText('Connect wallet to vote', { exact: true }).count(), 0);
    for (const button of await page.locator('[data-vote-button]').all()) assert.equal(await button.isDisabled(), true);
    assert.equal(browserHashes.length, 0);
    assert.equal(await page.evaluate(() => window.ethereum.request({ method: 'eth_chainId' })), '0x1');
    assert.deepEqual(switches, [], 'starter auto-switch is not certified');
    await page.screenshot({ path: path.join(work, 'wrong-network.png') });
    // Explicit test-wallet switch, not a claim about the starter auto-switch effect.
    await page.evaluate(() => window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x7a69' }] }));
    await page.waitForFunction(() => [...document.querySelectorAll('[data-vote-button]')].length === 2 && [...document.querySelectorAll('[data-vote-button]')].every((button) => !button.disabled));
    await page.locator('[data-connected-reads-ready="true"]').waitFor();
    assert.equal(await page.evaluate(() => window.ethereum.request({ method: 'eth_chainId' })), '0x7a69');
    assert.deepEqual(switches, ['0x7a69']);
    report.networkSwitchRequests = [...switches];
    await page.screenshot({ path: path.join(work, 'correct-network-control.png') });
    await context.close();
  });
  async function browserVote(account, side, yes, no, label) {
    const { context, page } = await pageFor(account);
    await page.goto(url);
    await text(page, 'Will local E2E pass?');
    await text(page, 'Connect wallet to vote');
    await page.screenshot({ path: path.join(work, `${label}-before.png`) });
    await page.getByRole('button', { name: 'Browser wallet', exact: true }).click();
    const before = browserHashes.length;
    await page.getByRole('button', { name: `Vote ${side} (10 Tokens)`, exact: true }).click();
    await text(page, 'Vote confirmed');
    await text(page, "You've staked 10 tokens");
    assert.equal(browserHashes.length - before, 2, 'actual approve+vote fallback');
    for (const [i, hash] of browserHashes.slice(before).entries()) {
      await receipt(`${label} browser ${i === 0 ? 'approve' : 'vote'}`, hash);
      const transaction = await client.getTransaction({ hash });
      assert.equal(transaction.from.toLowerCase(), account.toLowerCase());
      assert.equal(transaction.to.toLowerCase(), (i === 0 ? token : market).toLowerCase());
      const decoded = decodeFunctionData({ abi: i === 0 ? tokenArtifact.abi : marketArtifact.abi, data: transaction.input });
      assert.equal(decoded.functionName, i === 0 ? 'approve' : 'vote');
      if (i === 0) {
        assert.equal(decoded.args[0].toLowerCase(), market.toLowerCase());
        assert.equal(decoded.args[1], parseEther('10'));
      } else {
        assert.deepEqual(decoded.args, [0n, side === 'Yes', parseEther('10')]);
      }
      (report.browserCalls ??= []).push({ label, hash, functionName: decoded.functionName, args: decoded.args });
    }
    assert.equal((await m('markets', [0n]))[1], parseEther(yes));
    assert.equal((await m('markets', [0n]))[2], parseEther(no));
    await text(page, `Yes ${Number(BigInt(yes) * 100n / (BigInt(yes) + BigInt(no)))}%`);
    await page.screenshot({ path: path.join(work, `${label}-after.png`) });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(work, `${label}-narrow.png`) });
    await apiPools(yes, no);
    await context.close();
  }
  await check('Part3 browser approve+vote receipts, refreshed stake/odds, API agree', () => browserVote(voter, 'Yes', '10', '0', 'part3'));
  await check('Part4 synthetic transfer funds recipient (NOT Wallet MCP)', async () => {
    const before = await t('balanceOf', [recipient]);
    const senderBefore = await t('balanceOf', [owner]);
    await tx('Part4 synthetic transfer', owner, token, tokenArtifact.abi, 'transfer', [recipient, parseEther('10')]);
    assert.equal(await t('balanceOf', [recipient]), before + parseEther('10'));
    assert.equal(await t('balanceOf', [owner]), senderBefore - parseEther('10'));
    assert.equal(await t('allowance', [recipient, market]), 0n);
  });
  await check('Part4 recipient browser bet changes pools and token balances', async () => {
    assert.equal(await t('allowance', [recipient, market]), 0n, 'recipient browser approval starts from zero');
    await browserVote(recipient, 'No', '10', '10', 'part4');
    assert.equal(await t('balanceOf', [recipient]), 0n);
    assert.equal(await t('balanceOf', [market]), parseEther('20'));
    assert.equal(await t('allowance', [recipient, market]), 0n);
  });
  await check('Closed market rejects EVM simulation and hides voting while browser wallet is connected', async () => {
    await tx('Close V2', owner, market, marketArtifact.abi, 'resolveMarket', [0n, true]);
    await assert.rejects(() => client.simulateContract({ account: voter, address: market, abi: marketArtifact.abi, functionName: 'vote', args: [0n, true, parseEther('10')] }), /MarketAlreadyResolved/);
    const { context, page } = await pageFor(voter);
    await page.goto(url); await text(page, 'Market Resolved');
    await page.getByRole('button', { name: 'Browser wallet', exact: true }).click();
    await page.getByRole('button', { name: 'Disconnect', exact: true }).waitFor();
    await page.locator('[data-connected-reads-ready="true"]').waitFor();
    await text(page, 'Market Resolved');
    assert.equal(await page.locator('[data-vote-button]').count(), 0);
    assert.equal((await m('markets', [0n]))[1], parseEther('10'));
    await context.close();
  });
  report.passed = true;
} catch (error) {
  for (const [i, context] of (browser?.contexts() ?? []).entries()) {
    for (const [j, page] of context.pages().entries()) {
      await page.screenshot({ path: path.join(work, `failure-${i}-${j}.png`) }).catch(() => {});
      await save(`failure-${i}-${j}.json`, await page.evaluate(() => ({ body: document.body.innerText, requests: window.__requests })).catch(() => ({})));
    }
  }
  report.error = error.message;
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally {
  await cleanup();
  if (!report.cleanup) { report.passed = false; process.exitCode = 1; await save('report.json', report); }
  console.log(`${report.passed ? 'PASS' : 'FAIL'} local rehearsal; cleanup=${report.cleanup}; evidence=${work}`);
}
