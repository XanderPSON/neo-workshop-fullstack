# Local rehearsal evidence — reviewed fixes, 2026-11-17

## Scope and provenance

This record supersedes the earlier `e956f3b` rehearsal. It verifies the independently reviewed in-scope repairs: learner-test independence, settled wrong-chain reads with a positive control, exact browser calldata and zero starting allowance, connected closed-market behavior, repeated-interrupt cleanup, and normal-versus-legacy preflight setup.

Fullstack review base: `e956f3b5c69468d6411e16d2f209c405c8e4a7c2`. Contracts: `04f4355ea81503ec5c320f8ffc737160ae8b9f27`, clean working tree. Final runner SHA256: `a1f9e39abfa60ae98838814d8659029522b2aa63c3195ab2feedf1dcbf33929e`. App fixture SHA256: `4e51d2a042a9f306e9a269ba15126554ae7bfbcfec2425f4c0d68f83ac2af202`. Signal helper SHA256: `649f1eee527e3a80df05b4abff29ed71ea0a91422994b34a4c44bba7fba9ff5f`. These match both final reports. Node 24.21.0 meets the >=22 prerequisite; this is not a fresh Node22 installation trial.

Student source TODOs, dummy pod config, dependency versions, lockfile and source Next config are unchanged. No wallet APIs/settings, public-chain writes, credential changes, hosting, pushes or PR operations. Starforge and the contracts checkout were not edited here. The shared contracts instructor helper creates the disposable completed snapshot.

## Final repeatability proof

```sh
npm run test:e2e -- --contracts /Users/xander/src/lnd/neo/neo-workshop-smart-contracts/.worktrees/q4-token-base
```

Two consecutive final-code runs, no repairs or source changes between them:

- `/tmp/neo-e2e-SJH0RH`: exit 0, 14 checks, 17 successful receipts, `passed=true`, `cleanup=true`.
- `/tmp/neo-e2e-ljXOUi`: exit 0, same checks/receipts/verdict; fresh chain, app, browser storage and ports.

Each run passes 41 copied contract tests and the **full learner `npm test` after completing the disposable card: 27 tests**, including all instructor safety and preflight tests. No tests are skipped. The corresponding unchanged learner scaffold has 26 tests. Completion tests seed `scripts/e2e/scaffold/MarketCard.tsx.txt`, not the learner's current card, so completing Task 2 no longer breaks the test suite.

Actual mined browser approve/vote receipts drive pools `0/0 → 10/0 → 10/10`, refreshed odds/stakes and agreeing API JSON. The harness decodes each transaction and checks the exact spender, 10-token amount, market ID 0 and Yes/No side, as well as sender/target/status. After the insufficient-balance simulation, a mined approve(0) clears the recipient's allowance. It is asserted zero before the transfer and again immediately before that recipient's browser bet, so leftover approval cannot mask a broken browser approve call.

The wrong-chain browser assertion waits for both connected market and stake reads to succeed, the actual question, no stub and no disconnected prompt. Both buttons must be disabled. The **same provider/page** then receives the explicit `wallet_switchEthereumChain` request for `0x7a69`; exactly that request is recorded and both buttons must become enabled. This certifies the instructor-inserted chain guard, not the starter's automatic switching. Matched `wrong-network.png` and `correct-network-control.png` images show the control. Closed-market assertions connect the wallet, wait for connected reads, retain the resolved message and require zero vote buttons.

Negative contract checks in this harness are real EVM **simulations** for allowance, balance and resolved-market errors. They are not mined failed receipts or wallet rejection-UX tests. The companion contracts verifier covers mined failed transactions. Positive browser transactions here are mined; their decoded calls and receipts are retained in `report.json`.

## Shutdown and other validation

- `/tmp/neo-e2e-161KKW/double-interrupt.json`: two SIGINTs reached a live runner after browser voting; exit 130, `cleanup=true`; every recorded owned process group was verified absent. A unit test also holds cleanup pending while emitting repeated SIGINT/SIGTERM and requires a single cleanup/exit.
- Stress probes exposed Playwright's own default signal handler exiting before the runner finished cleanup. The runner now disables Playwright's process-signal handling, retains persistent guarded listeners, serializes evidence writes and prevents new work after interruption. Aborted-probe descendants were identified from recorded PID plus matching command/cwd and reaped; unrelated processes were untouched. Completed-command shutdown timers are cleared rather than delaying every test exit by three seconds.
- Root `npm test`: 26/26 across seven files; `/tmp/neo-review-final-tests.log`. Root `npm run lint`: no findings; `/tmp/neo-review-final-lint.log`. The preflight test uses a synthetic loopback RPC and proves default RPC-only setup exits 0 with exactly `eth_chainId`, without legacy facilitator or wallet-balance requests.
- Unchanged learner scaffold snapshot `/tmp/neo-review-scaffold-final.c6fslr`: tests/lint pass; isolated production build and `tsc --noEmit --incremental false` pass. See `final-tests.log`, `final-build-retry.log`, `final-typecheck.log`. Next's existing advisory nudge stopped the first build; the identical command succeeded on retry without dependency or security-setting changes. Completed-app lint/typecheck/build also pass within each final E2E.
- `git diff --check`: pass. Source app/components/lib, lockfile, source Next config and parent preview port3000 remain untouched. API JSON, decoded calls, reports and actual browser desktop/narrow screenshots remain in each final run directory. Prior screenshot inspection still shows the pre-existing narrow wallet-bar overlap and weak light-theme contrast; no UI redesign was attempted.

## Verdict and limits

Reviewed local execution, repeatability, learner test compatibility and owned cleanup: pass. This is a self-verification of fixes following independent static review, not a new independent review or security audit. Base Sepolia deployment/source verification, real Wallet MCP authorization/approval/transfer, browser-extension UX, atomic smart-wallet batching, hosting and classroom timing: not-run. Curriculum rendering/hosted before-after proof: not-applicable to this harness repair; parent owns curriculum work.

Existing Next/dependency advisories and optional connector build warnings remain outside this scope. Coverage percentages remain unavailable because the pinned dependency set lacks `@vitest/coverage-v8`; no dependency was added. First browser tooling installation still needs internet, disk and corporate CA trust where applicable; TLS verification remains enabled. Evidence is machine-local, not hosted PR proof. Normal preflight skips x402; `--legacy-x402` explicitly opts into separate legacy environment checks documented in `AI-TESTING.md`.
