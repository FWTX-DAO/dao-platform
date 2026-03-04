'use client';

import { useSubscriptionTiers, useActiveSubscription, useCreateCheckout } from '@hooks/useSubscriptions';
import SubscriptionCard from '@components/SubscriptionCard';

export default function SubscriptionsPage() {
  const { data: tiers = [], isLoading: tiersLoading } = useSubscriptionTiers();
  const { data: subscription, isLoading: subLoading } = useActiveSubscription();
  const checkout = useCreateCheckout();

  const isLoading = tiersLoading || subLoading;

  const handleSelect = (tierId: string) => {
    checkout.mutate(tierId);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
      <p className="text-gray-600">Support the DAO and unlock premium features</p>
      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
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
