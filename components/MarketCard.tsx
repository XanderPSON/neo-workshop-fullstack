'use client';

import type { useAccount } from 'wagmi';
import type { PodMarket } from '@/lib/podConfig';

export function MarketCard({
  pod,
}: {
  pod: PodMarket;
  account: ReturnType<typeof useAccount>;
}) {
  return (
    <div className="border border-yellow-600/50 rounded-xl p-5 flex flex-col items-center justify-center space-y-3 bg-yellow-900/20 min-h-[220px]">
      <div className="text-2xl">🔧</div>
      <div className="text-sm text-yellow-400 font-medium">
        {pod.owner}&apos;s Market
      </div>
      <div className="text-xs text-gray-500 text-center max-w-[240px] space-y-1">
        <p>Implement this component in</p>
        <code className="bg-gray-800 px-2 py-0.5 rounded text-yellow-300">
          components/MarketCard.tsx
        </code>
        <p className="pt-1 text-gray-600">
          Show market question, odds bar, pool sizes, and vote buttons
        </p>
      </div>
    </div>
  );
}
