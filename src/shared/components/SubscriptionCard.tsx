import React, { memo, useMemo } from 'react';
import { CheckCircle } from 'lucide-react';
import type { SubscriptionTier } from '@shared/hooks/useSubscriptions';

interface SubscriptionCardProps {
  tier: SubscriptionTier;
  isCurrentTier: boolean;
  onSelect: (tierId: string) => void;
  isLoading?: boolean;
}

function SubscriptionCard({ tier, isCurrentTier, onSelect, isLoading }: SubscriptionCardProps) {
  const priceDisplay = tier.priceCents === 0
    ? 'Free'
    : `$${(tier.priceCents / 100).toFixed(0)}`;

  const intervalDisplay = tier.billingInterval === 'lifetime'
    ? 'forever'
    : tier.billingInterval === 'month'
      ? '/mo'
      : '/yr';

  const features = useMemo(() => {
    if (!tier.features) return [];
    if (Array.isArray(tier.features)) return tier.features as string[];
    try {
      return JSON.parse(tier.features as string) as string[];
    } catch {
      return [];
    }
  }, [tier.features]);

  return (
    <div
      className={`bg-white rounded-lg p-6 flex flex-col ${
        isCurrentTier
          ? 'border-2 border-violet-500 shadow-md'
          : 'border border-gray-200 shadow-xs hover:shadow-md transition-shadow'
      }`}
    >
      {isCurrentTier && (
        <div className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 bg-violet-50 rounded-full px-3 py-1 mb-3 self-start">
          <CheckCircle className="h-3.5 w-3.5" />
          Current Plan
        </div>
      )}

      <h3 className="text-lg font-bold text-gray-900">{tier.displayName}</h3>

      <div className="mt-2 mb-4">
        <span className="text-3xl font-bold text-gray-900">{priceDisplay}</span>
        {tier.priceCents > 0 && (
          <span className="text-gray-500 text-sm ml-1">{intervalDisplay}</span>
        )}
        {tier.priceCents === 0 && (
          <span className="text-gray-500 text-sm ml-1">{intervalDisplay}</span>
        )}
      </div>

      {tier.description && (
        <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
      )}

      {features.length > 0 && (
        <ul className="space-y-2 mb-6 flex-1">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      )}

      {!isCurrentTier && tier.priceCents > 0 && (
        <button
          onClick={() => onSelect(tier.id)}
          disabled={isLoading}
          className="mt-auto w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
        >
          {isLoading ? 'Processing\u2026' : `Upgrade to ${tier.displayName}`}
        </button>
      )}

      {!isCurrentTier && tier.priceCents === 0 && (
        <div className="mt-auto text-center text-sm text-gray-500 py-2.5">
          Default plan
        </div>
      )}
    </div>
  );
}

export default memo(SubscriptionCard);
