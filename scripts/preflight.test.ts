// @vitest-environment node
import { expect, it } from 'vitest';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

it('normal preflight succeeds with RPC-only setup and never requests legacy services', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'neo-preflight-test-'));
  const methods: string[] = [];
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const part of req) body += part;
    const request = JSON.parse(body);
    methods.push(request.method);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: '0x14a34' }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test RPC address');
  try {
    await mkdir(path.join(root, 'node_modules/next'), { recursive: true });
    await writeFile(path.join(root, '.env.local'), `BASE_SEPOLIA_RPC=http://127.0.0.1:${address.port}\n`);
    const child = spawn(path.resolve('node_modules/.bin/tsx'), [path.resolve('scripts/preflight.ts')], {
      cwd: root, env: { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: 'test' },
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    const [code] = await once(child, 'exit');
    expect(code, output).toBe(0);
    expect(methods).toEqual(['eth_chainId']);
    expect(output).toContain('legacy checks skipped');
    expect(output).not.toContain('needed for Part 4, the x402 lab');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(root, { recursive: true, force: true });
  }
});
