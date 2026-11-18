# AI testing and recovery

## Choose the right mode first

For a learner asking for help, coach: inspect their current diff and failing check, explain the smallest next step, and let them implement it. A request to test or diagnose is not permission to finish the exercises. When they explicitly request implementation, scope changes to the named TODO/file, preserve the provided layout and helpers, and verify the result. Read `AGENTS.md` before editing. Reference implementations remain opt-in.

The current four-part lesson ends with an AI agent betting from its own CDP wallet on Base Sepolia (approve, then vote, built with Foundry and sent through Toshi's CDP connection). This repo also retains older, optional x402 exercises and tooling. x402 is not needed for that path. The local harness below is instructor verification, not a learner's solution or proof of the CDP agent-wallet step.

`npm run preflight` checks normal RPC-only app setup. Only an explicitly chosen legacy paid-API exercise uses `npm run preflight -- --legacy-x402`: provide the public server payout address `X402_PAY_TO` and optionally `X402_FACILITATOR_URL` in that legacy environment. `BUYER_PRIVATE_KEY` is optional, separate local backup-buyer configuration; never upload it to the app host or include its value in chat or logs. Normal Parts 3–4 require none of these opt-in variables.

## Repeatable local rehearsal (instructor)

Prerequisites: Node >=22, Python 3, `npm ci` in this checkout, Foundry (`forge`, `anvil`) on PATH, and the matching smart-contracts checkout with its pinned `lib/forge-std` installed. Keep that checkout stable while taking the snapshot. No wallet, secrets, API keys or running chain are needed.

From the fullstack checkout:

```sh
npm run test:e2e -- --contracts /absolute/path/to/neo-workshop-smart-contracts
```

Run the identical command twice to check fresh-state repeatability. Every run prints `Evidence: <temporary directory>`. Success requires exit 0, `passed: true` and `cleanup: true` in `report.json`. Failures exit nonzero and retain evidence too. The command runs the copied contracts' tests, the full `npm test` suite after disposable card completion (including instructor safety tests), lint, typecheck, an isolated production build, API and browser checks. Completion unit tests use the checked-in instructor scaffold, not the learner's current card; finishing Task 2 does not break them. The original learner TODOs and dummy pod config stay unchanged.

The runner calls the contracts checkout's `python3 script/prepare-instructor.py <fresh destination>` helper. This explicitly authorized instructor mode completes only copied exercise seams, preserving starter constructors; it may consult reference code in that disposable fixture. It deploys V1, token and V2, verifies cumulative V1 ETH stakes, then drives the real Next API and Wagmi browser reads. Browser clicks mine actual approve and vote transactions through an EIP-1193 synthetic provider on fresh loopback Anvil chain 31337. Checks decode spender, stake, market ID and side; verify receipts, refreshed pools, odds and balances; and start the recipient's browser approval from zero allowance. A synthetic token transfer funds that recipient's bet.

Negative contract checks here are EVM simulations for missing allowance, insufficient balance and a resolved market, not mined failed receipts or wallet rejection UX. The companion contracts verifier covers mined failed-receipt cases. The browser checks the closed market while connected. For network safety, the instructor fixture explicitly guards `account.chainId`: after connected reads settle, buttons are disabled on the wrong chain; an explicit switch request on the same synthetic provider/page then enables them. This positive control certifies the fixture guard, not the starter's automatic switching or a learner's implementation.

Only copied files get completed or switched from Base Sepolia to Anvil. There is no canonical Multicall3 on the local chain, so Wagmi's real individual-read fallback is exercised. Every browser context starts fresh; browser network access is limited to the owned app and RPC. This tests the non-atomic two-transaction fallback, not a smart-wallet batch.

Processes bind random loopback ports, never port 3000. The app has its own temporary `.next-e2e` build output. The runner terminates only process groups it started, on success, failure or Ctrl-C; repeated interrupts share the same cleanup rather than killing the runner early. It never resets or stops an existing chain or preview. Evidence and disposable snapshots remain for diagnosis. The harness installs pinned Playwright tooling into an OS temporary cache separate from workshop dependencies and downloads its Chromium if needed; first run needs internet/disk space. Workshop package versions and lockfile are unchanged.

## Diagnose without losing progress

1. Save the current diff or make a local checkpoint. Record the last successful step and exact failing command. Never reset a learner's repo, overwrite `.env.local`, recreate a wallet, redeploy or repeat a transfer as a generic repair.
2. Read `report.json` and the named step log in its evidence directory. `contracts-tests.log` isolates fixture/compiler problems; `typecheck.log` and `build.log` isolate app problems; `next.log` and API JSON isolate RPC/configuration problems. Browser before/after/narrow images show the actual app. A log or screenshot alone is not transaction confirmation.
3. For address/read failures, check chain ID, deployed code, V2 `token()`, market ID 0 and matching ABI. For votes, check token decimals, balance, allowance, open/resolved status, calls status and every receipt. The supplied helper always bets **10 tokens**; a new recipient needs at least 10 of that exact token plus test ETH.
4. If a live batch is pending, inspect its existing calls ID and receipts before retrying. Fallback approval and vote are separate: a failed vote may leave allowance; rejecting approval may still prompt for a vote. Reject remaining requests when cancelling, then check state. Never treat a calls ID as a transaction hash.
5. Repair the narrow cause, then rerun the failing check and the full command. Fixture-seam drift is a maintainer task, not permission to replace the learner's contracts or import reference code. Missing compiler/browser downloads require restoring tool access, not changing workshop dependencies.

The runner records its owned PIDs in `report.json`. If the runner itself was forcibly killed and cleanup could not execute, first confirm a PID is still the exact owned command from that evidence directory (PIDs can be reused). Terminate that process group only. Never use `killall node`, kill a port's unknown owner, or reset a shared Anvil instance. Temporary evidence can be removed after inspection; preserve any relevant failure report first.

## Live checks remain separate

A green local run does **not** establish Base Sepolia deployment/source verification, browser-extension approval UX, the CDP agent wallet's setup and sends, explorer confirmation, hosting or classroom timing. A facilitator must separately confirm on Base Sepolia that the agent wallet holds only test funds, then verify its one approve and one vote on BaseScan. Never point the agent wallet at mainnet, and do not change wallet security settings as recovery.

Keep keys, seed phrases, passwords, sign-in codes, environment-file contents and RPC credentials out of prompts, logs, screenshots and commits. This harness copies only allowlisted source/config files, sanitizes child environments and uses no private keys. In live diagnosis, record presence/absence of required settings and redacted errors, never dump `env`, `.env` or wallet files. Record each check as passed, failed, blocked or not run; preserve the learner's progress and distinguish local simulation from live completion.
