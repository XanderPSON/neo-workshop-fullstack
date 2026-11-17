# Local rehearsal evidence — 2026-11-17

## Scope

Instructor-only local execution of Parts 1–4's contract → API → browser → transfer → recipient-bet dependency chain. Student source TODOs, dummy pod config, dependencies, lockfile and source Next config remain unchanged. No real Wallet MCP calls, wallet settings, public-chain writes, hosted deployment, pushes or PRs. Starforge was read-only; contracts were consumed through their shared instructor snapshot helper, never edited here.

Fullstack base: `92f09523e75635fb2659262c1e802835c75d10e4`; docs checkpoint: `3e3c4b1`. Contracts: `04f4355ea81503ec5c320f8ffc737160ae8b9f27` with a clean working tree. Final harness SHA256: `e7beaaad84e9e03036b965a76e0661f7d043b6bb2d8cd41d01c3f7c7756b14f0`. Both final runs used identical harness, app-fixture and contract-helper hashes, recorded in their reports. Runtime: Node 24.21.0 (meets >=22, not a fresh Node22 installation rehearsal).

## Repeated command and observed results

```sh
npm run test:e2e -- --contracts /Users/xander/src/lnd/neo/neo-workshop-smart-contracts/.worktrees/q4-token-base
```

Two consecutive final-code runs, no repairs between runs:

- `/tmp/neo-e2e-ruS5Xg`: exit 0; 14 checks, 16 successful receipts, `passed=true`, `cleanup=true`; owned RPC/app ports 50539/50540.
- `/tmp/neo-e2e-xKSaxc`: exit 0; same checks/receipts and verdict; fresh owned ports 50655/50656.

Each run checks 41 copied contract tests, 20 copied app tests, completed-app lint/typecheck/production build, cumulative V1 ETH stakes and resolution, deployed V2/token wiring, API and actual browser reads, browser approve+vote fallback receipts, refreshed stake and odds, and API pools `0/0 → 10/0 → 10/10`. A synthetic sender loses 10 tokens, the recipient gains 10, then that recipient's browser bet consumes them and the exact allowance. Missing allowance, insufficient token balance, wrong connected chain and closed market are negative checks. Contract failures use actual EVM simulation with custom errors/state assertions; positive browser writes are mined transactions, not hook mocks.

Reports include receipt hashes and source/tool provenance. API JSON and browser desktop/narrow screenshots are retained in each directory. Local hashes only have meaning on their disposable chains. Inspected desktop and narrow images show successful voting; the existing fixed wallet bar overlaps the heading at narrow width and the light theme has weak contrast. Layout was deliberately preserved.

A direct SIGINT test after Anvil startup passed separately: `/tmp/neo-e2e-HfPxOo/report.json` records `interrupted=SIGINT`, `cleanup=true`; the runner exited 130 and every recorded process group was absent. Initial exploratory interruption testing found a double-cleanup race; memoized cleanup fixed it before both final runs. Failure preparation is covered by a unit test that requires a retained failed report and successful cleanup.

## Other validation

- `npm test`: 24/24 tests across six files, including five new harness/config safety checks; baseline was 19/19. Log: `/tmp/neo-fullstack-final-tests.log`.
- `npm run lint`: exit 0, no findings. Log: `/tmp/neo-fullstack-final-lint.log`.
- Untouched student scaffold copied to `/tmp/neo-scaffold-check.ZP4LLZ`: tests/lint pass; isolated production build (`.next-check`, webpack) and final `tsc --noEmit --incremental false` pass. The original build stopped once for Next's existing security-upgrade nudge; retry passed without changing dependencies. Logs: `build.log`, `build-retry.log`, `final-typecheck.log` there.
- `git diff --check`: pass. No diff in student app/components/lib, package-lock or source Next config. No process or build touched parent preview port3000.
- Coverage percentages: not available because pinned dependencies do not include `@vitest/coverage-v8`. Attempt recorded in `/tmp/neo-fullstack-coverage.log`; no dependency was installed or upgraded to obtain a number. Behavior checks, not a claimed coverage percentage, are the evidence.

## Limits and follow-up

Local execution: pass. Repetition and owned cleanup: pass. Base Sepolia live deploy/source verification, actual Wallet MCP authorization/approval/transfer, real extension UX, smart-wallet atomic batching, hosting and cohort pacing: not-run. Curriculum rendering/hosted before-after proof: not-applicable to this local harness task; parent owns curriculum changes. This is a self-review, not an independent review or security audit.

The instructor fixture explicitly checks `account.chainId` before enabling voting. The starter's page effect uses `useChainId()` which remained at the configured default while the connected synthetic wallet reported an unsupported chain; this run does not certify automatic switching. Browser fallback uses JSON-RPC method-not-found (`-32601`); provider error 4200 was not recognized as fallback by the pinned Viem version during exploratory testing. Real wallets need their own verification.

Existing Next security advisories and optional wallet-connector build warnings remain; dependency upgrades are outside this task. The normal env example is now RPC-only and old x402 exercises are labelled optional/legacy. First browser tooling install requires internet, corporate CA trust where applicable, and disk space; TLS verification stays enabled. Temporary evidence is machine-local, not durable hosted PR proof. No processes from these final runs remain; unrelated parent/worker processes are untouched.
