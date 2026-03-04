import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import {
  useSubscriptionTiers,
  useActiveSubscription,
  useCreateCheckout,
  useCreatePortalSession,
} from '@shared/hooks/useSubscriptions';
import { useProfile } from '@shared/hooks/useProfile';
import AppLayout from '@components/AppLayout';
import SubscriptionCard from '@components/SubscriptionCard';
import { CreditCardIcon } from '@heroicons/react/24/outline';

export default function SubscriptionsPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { data: tiers, isLoading: tiersLoading } = useSubscriptionTiers();
  const { data: subscription } = useActiveSubscription();
  const { data: profile } = useProfile();
  const checkout = useCreateCheckout();
  const portal = useCreatePortalSession();
  const [error, setError] = useState('');
  const [loadingTierId, setLoadingTierId] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !authenticated) router.push('/');
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) return null;

  const handleSelectTier = async (tierId: string) => {
    setError('');
    setLoadingTierId(tierId);
    try {
      const result = await checkout.mutateAsync(tierId);
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout');
      setLoadingTierId(null);
    }
  };

  const handleManageBilling = async () => {
    setError('');
    try {
      const result = await portal.mutateAsync();
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open billing portal');
    }
  };

  return (
    <AppLayout title="Subscriptions - Fort Worth TX DAO">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Tiers</h1>
          <p className="text-gray-600 mt-1">Support the DAO and unlock additional features</p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
        )}

        {/* Tier Cards */}
        {tiersLoading ? (
          <div className="py-16 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
          </div>
        ) : tiers && tiers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <SubscriptionCard
                key={tier.id}
                tier={tier}
                isCurrentTier={profile?.currentTierId === tier.id}
                onSelect={handleSelectTier}
                isLoading={loadingTierId === tier.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <CreditCardIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tiers available</p>
          </div>
        )}

        {/* Active Subscription Details */}
        {subscription && (
          <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Subscription</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Status</p>
                <p className="font-medium text-gray-900 capitalize">{subscription.status}</p>
              </div>
              {subscription.currentPeriodStart && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Current Period</p>
                  <p className="text-sm text-gray-900">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} –{' '}
                    {subscription.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              )}
              <div className="flex items-end">
                <button
                  onClick={handleManageBilling}
                  disabled={portal.isPending}
                  className="px-4 py-2 border border-violet-600 text-violet-600 rounded-md hover:bg-violet-50 font-medium text-sm transition disabled:opacity-50"
                >
                  {portal.isPending ? 'Opening...' : 'Manage Billing'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
