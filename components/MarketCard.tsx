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
    <div className="border border-yellow-600/50 rounded-xl p-5 flex flex-col items-center justify-center space-y-3 bg-yellow-900/20 min-h-[200px]">
      <div className="text-2xl">🔧</div>
      <div className="text-sm text-yellow-400 font-medium">
        MarketCard not implemented yet
      </div>
      <div className="text-xs text-gray-500">{pod.owner}&apos;s Market</div>
      <div className="text-xs text-gray-600 text-center max-w-[200px]">
        Build this component to show live market data and voting
      </div>
    </div>
  );
}
