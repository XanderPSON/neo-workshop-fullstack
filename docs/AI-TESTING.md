# AI testing and recovery

## Choose the right mode first

For a learner asking for help, coach: inspect their current diff and failing check, explain the smallest next step, and let them implement it. A request to test or diagnose is not permission to finish the exercises. When they explicitly request implementation, scope changes to the named TODO/file, preserve the provided layout and helpers, and verify the result. Read `AGENTS.md` before editing. Reference implementations remain opt-in.

The current four-part lesson ends with a Wallet MCP custom-token transfer and a teammate's dashboard bet. This repo also retains older, optional x402 exercises and tooling. x402 is not needed for that transfer/bet path. The local harness below is instructor verification, not a learner's solution or proof of Wallet MCP integration.

## Repeatable local rehearsal (instructor)

Prerequisites: Node >=22, `npm ci` in this checkout, Foundry (`forge`, `anvil`) on PATH, and the matching smart-contracts checkout with its pinned `lib/forge-std` installed. Keep that checkout stable while taking the snapshot. No wallet, secrets, API keys or running chain are needed.

From the fullstack checkout:

```sh
npm run test:e2e -- --contracts /absolute/path/to/neo-workshop-smart-contracts
```

Run the identical command twice to check fresh-state repeatability. Every run prints `Evidence: <temporary directory>`. Success requires exit 0, `passed: true` and `cleanup: true` in `report.json`. Failures exit nonzero and retain evidence too. The command runs the copied contracts' tests, app unit tests, lint, typecheck, an isolated production build, API and browser checks. The original learner TODOs and dummy pod config stay unchanged.

The harness uses an instructor-completed disposable contract snapshot, not drop-in reference classes. It deploys the actual V1, token and V2 constructors, verifies cumulative V1 ETH stakes, then drives the real Next API and Wagmi browser reads. Browser clicks submit actual approve and vote transactions through an EIP-1193 synthetic provider, using unlocked accounts on a fresh loopback Anvil chain 31337. It checks successful receipts, transaction targets/selectors, refreshed pools, odds, cumulative stakes, token balances and allowance. A local synthetic token transfer funds a second browser wallet's bet. Wrong-network refusal, missing allowance, insufficient balance and a resolved market must reject safely.

Only copied files get completed or switched from Base Sepolia to Anvil. There is no canonical Multicall3 on the local chain, so Wagmi's real individual-read fallback is exercised. Every browser context starts fresh; browser network access is limited to the owned app and RPC. This tests the non-atomic two-transaction fallback, not a smart-wallet batch.

Processes bind random loopback ports, never port 3000. The app has its own temporary `.next-e2e` build output. The runner terminates only process groups it started, on success, failure or Ctrl-C. It never resets or stops an existing chain or preview. Evidence and disposable snapshots remain for diagnosis. The harness installs pinned Playwright tooling into an OS temporary cache separate from workshop dependencies and downloads its Chromium if needed; first run needs internet/disk space. Workshop package versions and lockfile are unchanged.

## Diagnose without losing progress

1. Save the current diff or make a local checkpoint. Record the last successful step and exact failing command. Never reset a learner's repo, overwrite `.env.local`, recreate a wallet, redeploy or repeat a transfer as a generic repair.
2. Read `report.json` and the named step log in its evidence directory. `contracts-tests.log` isolates fixture/compiler problems; `typecheck.log` and `build.log` isolate app problems; `next.log` and API JSON isolate RPC/configuration problems. Browser before/after/narrow images show the actual app. A log or screenshot alone is not transaction confirmation.
3. For address/read failures, check chain ID, deployed code, V2 `token()`, market ID 0 and matching ABI. For votes, check token decimals, balance, allowance, open/resolved status, calls status and every receipt. The supplied helper always bets **10 tokens**; a new recipient needs at least 10 of that exact token plus test ETH.
4. If a live batch is pending, inspect its existing calls ID and receipts before retrying. Fallback approval and vote are separate: a failed vote may leave allowance; rejecting approval may still prompt for a vote. Reject remaining requests when cancelling, then check state. Never treat a calls ID as a transaction hash.
5. Repair the narrow cause, then rerun the failing check and the full command. Fixture-seam drift is a maintainer task, not permission to replace the learner's contracts or import reference code. Missing compiler/browser downloads require restoring tool access, not changing workshop dependencies.

The runner records its owned PIDs in `report.json`. If the runner itself was forcibly killed and cleanup could not execute, first confirm a PID is still the exact owned command from that evidence directory (PIDs can be reused). Terminate that process group only. Never use `killall node`, kill a port's unknown owner, or reset a shared Anvil instance. Temporary evidence can be removed after inspection; preserve any relevant failure report first.

## Live checks remain separate

A green local run does **not** establish Base Sepolia deployment/source verification, browser-extension approval UX, Base Account batching, Wallet MCP session authorization, token indexing, real transfer approval, explorer confirmation, hosting or classroom timing. A facilitator and learner must separately confirm the actual Wallet MCP wallet supports Base Sepolia with per-write approval, then verify the one approved transfer and recipient bet. Stop on mainnet-only or automatic-spending sessions; do not change wallet security settings as recovery.

Keep keys, seed phrases, passwords, sign-in codes, environment-file contents and RPC credentials out of prompts, logs, screenshots and commits. This harness copies only allowlisted source/config files, sanitizes child environments and uses no private keys. In live diagnosis, record presence/absence of required settings and redacted errors, never dump `env`, `.env` or wallet files. Record each check as passed, failed, blocked or not run; preserve the learner's progress and distinguish local simulation from live completion.
