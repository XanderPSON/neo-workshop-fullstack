# Fullstack Workshop

## Overview

This is a Next.js starter app for building a prediction market aggregator dashboard.
Participants implement both backend (API route) and frontend (React component) code to read onchain data and submit transactions.

The app aggregates prediction markets from an entire pod (group of participants) into one dashboard.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript 5.x (Strict Mode)
- React 18
- Tailwind CSS 3.x
- OnchainKit (wallet connection, `<Transaction>` components)
- Wagmi 2.x (React hooks for Ethereum)
- Viem 2.x (Ethereum utilities)
- Vitest (testing)
- Target chain: Base Sepolia

## Commands

```
npm install          # Install dependencies
npm run dev          # Dev server → http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run tests (vitest)
npm run test:watch   # Watch mode
```

## Project Structure

```
app/
├── layout.tsx              # Root layout with OnchainKit providers
├── providers.tsx            # Wagmi + OnchainKit config
├── page.tsx                # Main page — renders wallet + MarketCard grid (scaffold, no TODOs)
├── page.test.tsx           # Tests for the main page
├── globals.css             # Tailwind base styles
└── api/
    └── markets/
        └── route.ts        # API route stub — participant builds this (Task 1)
components/
└── MarketCard.tsx          # Market card stub — participant builds this (Tasks 2 & 3)
lib/
├── contracts.ts            # ABI definitions (PredictionMarketABI, ERC20ABI)
└── podConfig.ts            # Pod member addresses (participant fills this in)
solutions/                  # RESTRICTED — see below
```

## What Participants Implement

There are three tasks across two files:

### Task 1: Backend — `app/api/markets/route.ts`

The stub returns a 501. Participants replace it with a real API route that reads market data from the blockchain using Viem's `createPublicClient`.

**What to build:** A `GET` handler that calls `markets(0)` on each pod contract and returns JSON with question, pool sizes, resolved status.

**Key APIs:** `createPublicClient`, `http`, `baseSepolia` (viem), `readContract`, `formatEther`, `NextResponse.json()` (next/server)

### Task 2: Frontend — `components/MarketCard.tsx`

The stub shows a "not implemented yet" placeholder. Participants replace it with a component that displays live market data.

**What to build:** Use Wagmi's `useReadContracts` hook to batch-fetch `markets(0)` and `hasVoted(0, address)` from the pod's market contract. Display the question, an odds bar (green/red), and pool sizes.

**Key APIs:** `useReadContracts` (wagmi), `formatEther` (viem), `PredictionMarketABI` (`@/lib/contracts`)

### Task 3: Transactions — Vote buttons in `components/MarketCard.tsx`

Add voting to the MarketCard by building batched `approve` + `vote` call arrays with `encodeFunctionData`, then wiring them into OnchainKit's `<Transaction>` component.

**What to build:** Two call arrays (yes/no) that each batch `approve(marketAddress, amount)` on the token contract followed by `vote(marketId, side, amount)` on the market contract. Wrap in `<Transaction>` components.

**Key APIs:** `encodeFunctionData`, `parseEther` (viem), `Transaction`, `TransactionButton`, `TransactionSponsor` (`@coinbase/onchainkit/transaction`)

## Key Patterns

- **Server-side reads via Viem**: `createPublicClient` + `readContract` for the API route. No wallet needed — this is read-only.
- **Client-side reads via Wagmi**: `useReadContracts` batches multiple contract calls into a single multicall RPC request. Each result maps to a Solidity struct: `[question, yesPool, noPool, resolved, outcome]`
- **Batched approve + vote**: Voting requires two calls in sequence — `approve(marketAddress, amount)` on the token, then `vote(marketId, side, amount)` on the market. OnchainKit's `<Transaction>` component handles batching these.
- **`encodeFunctionData`**: Use Viem's `encodeFunctionData` to encode contract calls for the `<Transaction>` component's `calls` prop.

## Conventions

- Client components use `'use client'` directive
- Contract addresses come from `lib/podConfig.ts` — never hardcode addresses in components
- ABIs come from `lib/contracts.ts`
- Market ID is `0n` (BigInt zero) — each contract has one market
- Token amounts use 18 decimals (`parseEther` from viem)

## Environment Variables

Participants need a `.env.local` with:
```
NEXT_PUBLIC_ONCHAINKIT_API_KEY=<from CDP portal>
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
BASE_SEPOLIA_RPC=https://sepolia.base.org
```

## Solutions (RESTRICTED)

The `solutions/` directory contains reference implementations:
- `solutions/api-markets-route.ts` — reference for `app/api/markets/route.ts`
- `solutions/MarketCard.tsx` — reference for `components/MarketCard.tsx`

**DO NOT** read, reference, or use any file in `solutions/` unless the user explicitly asks to compare their work against the solution (e.g., "check my answer", "compare with the reference", "look at the solution").

Do not mention solution files unprompted.
