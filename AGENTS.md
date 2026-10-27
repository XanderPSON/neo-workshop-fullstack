# Fullstack Workshop

## Overview

This is a Next.js starter app for building a prediction market aggregator dashboard.
Participants implement both backend (API route) and frontend (React component) code to read onchain data and submit transactions, then turn the API into a paid endpoint with x402 and buy it with an agent.

The app aggregates prediction markets from an entire pod (group of participants) into one dashboard.

## Tech Stack

- Node.js 22+
- Next.js 16 (App Router)
- TypeScript 5.x (Strict Mode)
- React 19
- Tailwind CSS 3.x
- Wagmi 3.x (React hooks for Ethereum; `useSendCalls` for batched transactions)
- Viem 2.x (Ethereum utilities)
- x402 (`@x402/next`, `@x402/core`, `@x402/evm`, `@x402/fetch`) for HTTP 402 payments in test USDC
- Vitest (testing)
- Target chain: Base Sepolia (`eip155:84532`). Testnet only.

All dependency versions are pinned exactly in `package.json`. Do not upgrade them during the workshop.

## Commands

```
npm install          # Install dependencies
npm run dev          # Dev server → http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run tests (vitest)
npm run buy -- <url> # Backup buyer: pay an x402 endpoint from BUYER_PRIVATE_KEY
```

## Project Structure

```
app/
├── layout.tsx              # Root layout
├── providers.tsx           # WagmiProvider + React Query
├── page.tsx                # Main page — wallet bar + MarketCard grid (scaffold, no TODOs)
├── page.test.tsx           # Tests for the main page
├── globals.css             # Tailwind base styles
└── api/
    └── markets/
        └── route.ts        # API route stub — participant builds this (Task 1), then gates it (Task 4)
components/
├── MarketCard.tsx          # Market card stub — participant builds this (Tasks 2 & 3)
└── WalletBar.tsx           # Connect / disconnect, address, ETH balance (provided)
lib/
├── contracts.ts            # ABI definitions (PredictionMarketABI, ERC20ABI)
├── podConfig.ts            # Pod member addresses (participant fills this in)
├── wagmi.ts                # Wagmi config: Base Sepolia, Base Account + browser wallet connectors
└── x402.ts                 # x402 resource server (public testnet facilitator) + payTo() helper
scripts/
└── buy.ts                  # Backup x402 buyer with a $0.01 spend cap
solutions/                  # RESTRICTED — see below
```

## What Participants Implement

### Task 1: Backend — `app/api/markets/route.ts`

The stub returns a 501. Participants replace it with a real API route that reads market data from the blockchain using Viem's `createPublicClient`.

**What to build:** A `GET` handler that calls `markets(0)` on each pod contract and returns JSON with question, pool sizes, resolved status.

**Key APIs:** `createPublicClient`, `http`, `baseSepolia` (viem), `readContract`, `formatEther`, `NextResponse.json()` (next/server)

### Task 2: Frontend — `components/MarketCard.tsx`

The stub shows a "not implemented yet" placeholder. Participants replace it with a component that displays live market data.

**What to build:** Use Wagmi's `useReadContracts` hook to batch-fetch `markets(0)` and `amountVoted(0, address)` from the pod's market contract. Display the question, an odds bar (green/red), pool sizes, and the user's stake.

**Key APIs:** `useReadContracts` (wagmi), `formatEther` (viem), `PredictionMarketABI` (`@/lib/contracts`)

### Task 3: Transactions — Vote buttons in `components/MarketCard.tsx`

**What to build:** Two call arrays (yes/no) that each batch `approve(marketAddress, amount)` on the token contract followed by `vote(marketId, side, amount)` on the market contract. Send them with `useSendCalls` (pass `experimental_fallback: true` so wallets without batching send two transactions), track them with `useWaitForCallsStatus`, and give each vote button a `data-vote-button` attribute.

**Key APIs:** `encodeFunctionData`, `parseEther` (viem), `useSendCalls`, `useWaitForCallsStatus` (wagmi)

### Task 4: Get paid — gate `app/api/markets/route.ts` with x402

**What to build:** Keep the Task 1 handler, rename it `handler`, and export `GET = withX402(handler, { accepts: [{ scheme: 'exact', price: '$0.01', network: X402_NETWORK, payTo: () => payTo() }], description, mimeType: 'application/json' }, x402Server)`. Unpaid requests now get `402 Payment Required`; paid requests get the JSON and settle 0.01 test USDC to `X402_PAY_TO`. Payments only settle when the handler returns a status below 400.

**Key APIs:** `withX402` (`@x402/next`), `x402Server`, `X402_NETWORK`, `payTo` (`@/lib/x402`)

**Check it:** `curl -i <url>/api/markets` shows `HTTP/1.1 402` and a `payment-required` header.

### Task 5: Buy it with an agent

Not code in this repo. In Toshi, connect the Coinbase Wallet MCP and ask the agent to fetch the deployed HTTPS URL with `initiate_x402_request` and a `maxPayment` of 0.01, approve in the wallet, then summarize the markets. Backup path: `npm run buy -- https://<app>.vercel.app/api/markets`.

## Key Patterns

- **Server-side reads via Viem**: `createPublicClient` + `readContract` for the API route. No wallet needed — this is read-only.
- **Client-side reads via Wagmi**: `useReadContracts` batches multiple contract calls into a single multicall RPC request. Each result maps to a Solidity struct: `[question, yesPool, noPool, resolved, outcome]`
- **Batched approve + vote**: Voting requires two calls in sequence — `approve(marketAddress, amount)` on the token, then `vote(marketId, side, amount)` on the market. `useSendCalls` sends both; smart wallets show one approval.
- **`encodeFunctionData`**: Use Viem's `encodeFunctionData` to encode each call's `data`.
- **x402**: the server answers unpaid requests with 402 and machine-readable payment requirements; the client signs a USDC transfer authorization and retries; the facilitator verifies and settles onchain. What you sell is aggregation and delivery, not secrecy: the contract state is public.
- **Spend caps are the guardrail**: buyers enforce a maximum payment in code or wallet settings (`maxPayment`, `spendControls`). A prompt is not a security boundary.

## Conventions

- Client components use `'use client'` directive
- Contract addresses come from `lib/podConfig.ts` — never hardcode addresses in components
- ABIs come from `lib/contracts.ts`
- Market ID is `0n` (BigInt zero) — each contract has one market
- Token amounts use 18 decimals (`parseEther` from viem); USDC uses 6
- Secrets and payout addresses are server-side env vars. Never prefix them with `NEXT_PUBLIC_`.

## Environment Variables

Participants need a `.env.local` (copy `.env.local.example`):

```
BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
X402_PAY_TO=<your dev wallet address>     # Task 4
BUYER_PRIVATE_KEY=<test wallet with USDC>  # optional backup buyer
```

On Vercel, set `X402_PAY_TO` and `BASE_SEPOLIA_RPC` in Project Settings → Environment Variables.

## Solutions (RESTRICTED)

The `solutions/` directory contains reference implementations:
- `solutions/api-markets-route.ts` — reference for Task 1
- `solutions/MarketCard.tsx` — reference for Tasks 2 & 3
- `solutions/api-markets-route-paid.ts` — reference for Task 4

**DO NOT** read, reference, or use any file in `solutions/` unless the user explicitly asks to compare their work against the solution (e.g., "check my answer", "compare with the reference", "look at the solution").

Do not mention solution files unprompted.
