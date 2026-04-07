# Prediction Market Aggregator

A Next.js starter app for the **Intro to Onchain Development** workshop (Part 3). This app aggregates prediction markets from your entire pod into a single dashboard where you can view odds and place votes.

This workshop uses **AI-driven development**: prompt your AI assistant to generate React components, Wagmi hooks, and OnchainKit integrations from the architectural requirements in the code, review the output, then deploy.

## The Cross-Wire

This app is designed to show **all markets** from your pod, not just yours. You need to collect the **Market contract address** and **Token contract address** from each pod-mate and wire them into `lib/podConfig.ts`.

## Quick Start

1. **Install dependencies**

    ```bash
    npm install
    ```

2. **Configure environment**

    Create `.env.local`:

    ```bash
    # OnchainKit API Key (optional, get one at https://portal.cdp.coinbase.com/)
    NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_cdp_api_key_here

    # Your dev wallet private key for server-side admin operations (hex-prefixed)
    PRIVATE_KEY=0x..your_private_key_here..

    # Base Sepolia RPC
    BASE_SEPOLIA_RPC=https://sepolia.base.org
    NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
    ```

3. **Add your pod's contracts**

    Open `lib/podConfig.ts` and add entries for each pod member:

    ```typescript
    export const POD_MARKETS = [
      {
        owner: "Alice",
        marketAddress: "0x123...",
        tokenAddress: "0xabc...",
      },
      // ... add everyone in your pod
    ];
    ```

4. **Run the dev server**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser.

## What You'll Build

The starter provides the layout scaffolding, wallet connection, and card grid. You'll implement three things:

### Task 1: Backend — `app/api/markets/route.ts`

Create a Next.js API route that reads market data from the blockchain using Viem. This is a server-side endpoint that calls `markets(0)` on each pod contract and returns JSON.

**Key APIs:** `createPublicClient`, `http`, `baseSepolia`, `client.readContract()`, `formatEther()`, `NextResponse.json()`

### Task 2: Frontend — `components/MarketCard.tsx`

Replace the yellow placeholder stub with a real component that displays live market data. Use Wagmi's `useReadContracts` hook to batch-fetch `markets(0)` and `hasVoted(0, address)` from each pod contract.

**Key APIs:** `useReadContracts` (wagmi), `formatEther` (viem), `PredictionMarketABI` (`@/lib/contracts`)

### Task 3: Transactions — Vote buttons in MarketCard

Add voting to your MarketCard by building batched `approve` + `vote` call arrays with `encodeFunctionData`, then wiring them into OnchainKit's `<Transaction>` component.

**Key APIs:** `encodeFunctionData`, `parseEther` (viem), `Transaction`, `TransactionButton`, `TransactionSponsor` (`@coinbase/onchainkit/transaction`)

## Tech Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [OnchainKit](https://onchainkit.xyz) (wallet connection, transaction components)
- [Wagmi](https://wagmi.sh) (React hooks for Ethereum)
- [Viem](https://viem.sh) (Ethereum utilities)
- [Tailwind CSS](https://tailwindcss.com) (styling)

## Deploying

Push to GitHub and deploy on [Vercel](https://vercel.com). Add your env vars (`NEXT_PUBLIC_ONCHAINKIT_API_KEY`, `NEXT_PUBLIC_RPC_URL`) in the Vercel dashboard.
