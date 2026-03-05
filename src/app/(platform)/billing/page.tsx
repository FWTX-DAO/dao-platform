'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  useSubscriptionTiers,
  useActiveSubscription,
  useCreateCheckout,
  useCreatePortalSession,
} from '@hooks/useSubscriptions';
import { queryKeys } from '@shared/constants/query-keys';
import SubscriptionCard from '@components/SubscriptionCard';

export default function SubscriptionsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { data: tiers = [], isLoading: tiersLoading } = useSubscriptionTiers();
  const { data: subscription, isLoading: subLoading } = useActiveSubscription();
  const checkout = useCreateCheckout();
  const portal = useCreatePortalSession();

  const success = searchParams.get('success') === 'true';
  const canceled = searchParams.get('canceled') === 'true';

  // Invalidate + poll caches when returning from Stripe checkout.
  // The webhook is async so the subscription may not be recorded yet on first fetch.
  useEffect(() => {
    if (!success) return;

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.active() });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.profile() });
    };

    // Immediate invalidation
    invalidateAll();

    // Poll a few times to catch webhook delay (2s, 5s, 10s)
    const timers = [2000, 5000, 10000].map((ms) => setTimeout(invalidateAll, ms));
    return () => timers.forEach(clearTimeout);
  }, [success, queryClient]);

  const isLoading = tiersLoading || subLoading;

  const handleSelect = (tierId: string) => {
    checkout.mutate(tierId);
  };

  const handleManage = () => {
    portal.mutate(undefined, {
      onSuccess: (data) => {
        if (data.url) window.location.href = data.url;
      },
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
      <p className="text-gray-600">Support the DAO and unlock premium features</p>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">
            Welcome aboard! Your membership is being activated. It may take a moment to reflect.
          </p>
        </div>
      )}

      {canceled && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800">
            Checkout was canceled. You can try again whenever you&apos;re ready.
          </p>
        </div>
      )}

      {subscription && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-violet-800">
              You have an active subscription
            </p>
            <p className="text-xs text-violet-600 mt-0.5">
              Status: {subscription.status} &middot; Manage billing, update payment method, or cancel.
            </p>
          </div>
          <button
            onClick={handleManage}
            disabled={portal.isPending}
            className="shrink-0 px-4 py-2 text-sm font-medium text-violet-700 bg-white border border-violet-300 rounded-md hover:bg-violet-100 transition-colors disabled:opacity-50"
          >
            {portal.isPending ? 'Opening\u2026' : 'Manage Subscription'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Loading\u2026</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier: any) => (
            <SubscriptionCard
              key={tier.id}
              tier={tier}
              isCurrentTier={subscription?.tierId === tier.id}
              onSelect={handleSelect}
              isLoading={checkout.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
