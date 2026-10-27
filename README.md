# Prediction Market Aggregator

A Next.js starter app for Day 2 of the **Intro to Onchain Development** workshop. This app aggregates prediction markets from your entire pod into a single dashboard where you can view odds and place votes.

This workshop uses **AI-driven development**: prompt Toshi (or your AI coding agent) to generate the API route, Wagmi hooks, and x402 gate from the requirements in the code, read the diff, then deploy. You need **Node.js 22+**.

## The Cross-Wire

This app is designed to show **all markets** from your pod, not just yours. You need to collect the **Market contract address** and **Token contract address** from each pod-mate and wire them into `lib/podConfig.ts`.

## Quick Start

1. **Install dependencies**

    ```bash
    npm ci
    ```

2. **Configure environment**

    ```bash
    cp .env.local.example .env.local
    ```

    Set `X402_PAY_TO` to your dev wallet address before Task 4.

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

The starter provides the layout scaffolding, wallet connection, and card grid. You'll implement five things:

### Task 1: Backend — `app/api/markets/route.ts`

Create a Next.js API route that reads market data from the blockchain using Viem. This is a server-side endpoint that calls `markets(0)` on each pod contract and returns JSON.

**Key APIs:** `createPublicClient`, `http`, `baseSepolia`, `client.readContract()`, `formatEther()`, `NextResponse.json()`

### Task 2: Frontend — `components/MarketCard.tsx`

Replace the yellow placeholder stub with a real component that displays live market data. Use Wagmi's `useReadContracts` hook to batch-fetch `markets(0)` and `amountVoted(0, address)` from each pod contract.

**Key APIs:** `useReadContracts` (wagmi), `formatEther` (viem), `PredictionMarketABI` (`@/lib/contracts`)

### Task 3: Transactions — Vote buttons in MarketCard

Add voting: `buildVoteCalls(pod, side)` in `lib/voteCalls.ts` already encodes the `approve` + `vote` pair. Send it with wagmi's `useSendCalls` (smart wallets show one approval; other wallets fall back to two transactions), track it with `useWaitForCallsStatus`, and refetch the card once it lands.

**Key APIs:** `buildVoteCalls` (`@/lib/voteCalls`), `useSendCalls`, `useWaitForCallsStatus` (wagmi)

### Task 4: Get paid — x402 on `app/api/markets/route.ts`

Wrap your Task 1 handler with `withX402` so unpaid requests get `402 Payment Required` and paid ones settle **0.01 test USDC** to `X402_PAY_TO`. The server uses the public Base Sepolia facilitator at `https://x402.org/facilitator`, so no API key is needed.

**Key APIs:** `withX402` (`@x402/next`), `x402Server`, `X402_NETWORK`, `payTo` (`@/lib/x402`)

### Task 5: Buy it with an agent

Deploy to Vercel first (the agent needs an HTTPS URL). In Toshi, connect the Coinbase Wallet MCP and ask the agent to buy your endpoint with a `maxPayment` of 0.01 USDC. Backup: `npm run buy -- https://<app>.vercel.app/api/markets --max-payment 0.005` (refuses: the price is above the cap), then without `--max-payment` (pays $0.01), with `BUYER_PRIVATE_KEY` set.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [x402](https://docs.cdp.coinbase.com/x402/welcome) (HTTP 402 payments)
- [Wagmi](https://wagmi.sh) (React hooks for Ethereum)
- [Viem](https://viem.sh) (Ethereum utilities)
- [Tailwind CSS](https://tailwindcss.com) (styling)

## Deploying

Push to GitHub and deploy on [Vercel](https://vercel.com). Add `X402_PAY_TO`, `BASE_SEPOLIA_RPC` and `NEXT_PUBLIC_RPC_URL` in the Vercel dashboard, or run `vercel --prod` and add them with `vercel env add`.
