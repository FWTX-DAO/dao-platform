'use client';

import { useState } from 'react';
import { useSubscriptionTiers } from '@shared/hooks/useSubscriptions';

interface PlanSelectorProps {
  selectedTierId: string | null;
  onSelect: (tierId: string | null) => void;
}

export function PlanSelector({ selectedTierId, onSelect }: PlanSelectorProps) {
  const { data: tiers = [], isLoading } = useSubscriptionTiers();
  const [interval, setInterval] = useState<'month' | 'year'>('month');

  if (isLoading) {
    return <div className="py-8 text-center text-dao-cool/40 text-sm">Loading plans...</div>;
  }

  // Find the tier matching the selected billing interval
  const monthlyTier = tiers.find((t) => t.billingInterval === 'month' && t.priceCents > 0);
  const annualTier = tiers.find((t) => t.billingInterval === 'year' && t.priceCents > 0);
  const activeTier = interval === 'month' ? monthlyTier : annualTier;

  const features = [
    'Full forum participation',
    'Project creation & collaboration',
    'Bounty submissions',
    'Meeting notes access',
    'Document uploads',
    'Member directory',
  ];

  const isPaidSelected = selectedTierId && activeTier && selectedTierId === activeTier.id;

  return (
    <div className="space-y-6">
      <p className="text-sm text-dao-cool/50">
        Start free or become a member. You can upgrade anytime.
      </p>

      {/* Billing toggle */}
      <div className="flex items-center justify-center">
        <div className="inline-flex bg-dao-surface border border-dao-border rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => {
              setInterval('month');
              if (isPaidSelected && monthlyTier) onSelect(monthlyTier.id);
            }}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${
              interval === 'month'
                ? 'bg-dao-gold text-dao-charcoal'
                : 'text-dao-cool/60 hover:text-dao-warm'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => {
              setInterval('year');
              if (isPaidSelected && annualTier) onSelect(annualTier.id);
            }}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${
              interval === 'year'
                ? 'bg-dao-gold text-dao-charcoal'
                : 'text-dao-cool/60 hover:text-dao-warm'
            }`}
          >
            Annual
            <span className="ml-1.5 text-[10px] font-bold tracking-wide uppercase opacity-70">
              save 18%
            </span>
          </button>
        </div>
      </div>

      {/* Membership card */}
      {activeTier && (
        <button
          type="button"
          onClick={() => onSelect(activeTier.id)}
          className={`w-full text-left p-6 rounded-lg border transition-all duration-200 ${
            isPaidSelected
              ? 'border-dao-gold bg-dao-gold/10 ring-1 ring-dao-gold/40'
              : 'border-dao-border bg-dao-surface/50 hover:border-dao-gold/30'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-dao-warm">DAO Membership</span>
            {isPaidSelected && (
              <svg className="h-5 w-5 text-dao-gold" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="mb-4">
            <span className="text-3xl font-bold text-dao-warm">
              ${interval === 'month' ? '5' : '49'}
            </span>
            <span className="text-dao-cool/60 text-sm ml-1">
              /{interval === 'month' ? 'mo' : 'yr'}
            </span>
            {interval === 'year' && (
              <span className="ml-2 text-[11px] text-dao-gold/70 bg-dao-gold/10 px-2 py-0.5 rounded">
                2 months free
              </span>
            )}
          </div>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-dao-cool/70">
                <svg className="h-4 w-4 text-dao-gold/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </button>
      )}

      {/* Skip / free option */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`w-full text-center py-3 text-sm transition-colors ${
          selectedTierId === null
            ? 'text-dao-gold font-medium'
            : 'text-dao-cool/40 hover:text-dao-cool/70'
        }`}
      >
        {selectedTierId === null ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 text-dao-gold" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            Continuing as observer (free)
          </span>
        ) : (
          'Skip — continue as observer (free)'
        )}
      </button>
    </div>
  );
}
