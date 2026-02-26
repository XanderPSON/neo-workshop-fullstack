# Prediction Market Aggregator

A Next.js starter app for the **Intro to Onchain Development** workshop (Part 3). This app aggregates prediction markets from your entire pod into a single dashboard where you can view odds and place votes.

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
    NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
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

The starter provides the layout scaffolding, wallet connection, and market card grid. You'll implement:

1. **Reading onchain data** — `useReadContracts` (multicall) to fetch market odds from all pod contracts
2. **Writing onchain data** — Batched `approve` + `vote` transactions using OnchainKit's `<Transaction>` component
3. **Enhancements** — Odds visualization, token balances, claim winnings

## Tech Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [OnchainKit](https://onchainkit.xyz) (wallet connection, transaction components)
- [Wagmi](https://wagmi.sh) (React hooks for Ethereum)
- [Viem](https://viem.sh) (Ethereum utilities)
- [Tailwind CSS](https://tailwindcss.com) (styling)

## Deploying

Push to GitHub and deploy on [Vercel](https://vercel.com). Add your env vars in the Vercel dashboard.
