# Fullstack Workshop

## Overview

This is a Next.js starter app for building a prediction market aggregator dashboard.
Participants implement onchain data reading and transaction writing by filling in TODOs in `app/page.tsx`.

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
├── layout.tsx       # Root layout with OnchainKit providers
├── providers.tsx     # Wagmi + OnchainKit config
├── page.tsx         # Main page — participant implements TODOs here
└── globals.css      # Tailwind base styles
lib/
├── contracts.ts     # ABI definitions (PredictionMarketABI, ERC20ABI)
└── podConfig.ts     # Pod member addresses (participant fills this in)
solutions/           # RESTRICTED — see below
```

## What Participants Implement

All work happens in `app/page.tsx`. The TODOs are:

1. **Reading onchain data** — Uncomment and wire up `useReadContracts` to fetch market data (question, pools, resolved status) from all pod contracts via multicall
2. **Building vote transactions** — Create batched call arrays that pair `approve()` on the token contract with `vote()` on the market contract
3. **Transaction components** — Replace placeholder buttons with OnchainKit `<Transaction>` components that execute the batched calls

## Key Patterns

- **Multicall via `useReadContracts`**: Batch multiple contract reads into a single RPC request. Each result maps to a Solidity struct: `[question, yesPool, noPool, resolved, outcome]`
- **Batched approve + vote**: Voting requires two calls in sequence — `approve(marketAddress, amount)` on the token, then `vote(marketId, side, amount)` on the market. OnchainKit's `<Transaction>` component handles batching these.
- **`encodeFunctionData`**: Use Viem's `encodeFunctionData` to encode contract calls for the `<Transaction>` component's `calls` prop.

## Conventions

- Client components use `'use client'` directive
- Contract addresses come from `lib/podConfig.ts` — never hardcode addresses in components
- ABIs come from `lib/contracts.ts`
- Use `parseEther('10')` for token amounts (18 decimals)
- Market ID is `0n` (BigInt zero) — each contract has one market

## Environment Variables

Participants need a `.env.local` with:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<from WalletConnect dashboard>
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
```

## Solutions (RESTRICTED)

The `solutions/` directory contains reference implementations.

**DO NOT** read, reference, or use any file in `solutions/` unless the user explicitly asks to compare their work against the solution (e.g., "check my answer", "compare with the reference", "look at the solution").

Do not mention solution files unprompted.
