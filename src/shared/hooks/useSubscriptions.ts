import { useQuery, useMutation } from '@tanstack/react-query';
import { getAccessToken } from '@privy-io/react-auth';
import { queryKeys } from '@shared/constants/query-keys';

export interface SubscriptionTier {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  priceCents: number;
  billingInterval: string;
  features: string | null;
  stripePriceId: string | null;
  isActive: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveSubscription {
  id: string;
  memberId: string;
  tierId: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
  trialEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

const fetchTiers = async (): Promise<SubscriptionTier[]> => {
  const response = await fetch('/api/subscriptions/tiers');
  if (!response.ok) throw new Error(`Failed to fetch tiers: ${response.statusText}`);
  const json = await response.json();
  return json.data ?? json;
};

const fetchActiveSubscription = async (): Promise<ActiveSubscription | null> => {
  const accessToken = await getAccessToken();
  const response = await fetch('/api/subscriptions', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch subscription: ${response.statusText}`);
  const json = await response.json();
  return json.data ?? json;
};

const createCheckoutSession = async (tierId: string): Promise<{ url: string }> => {
  const accessToken = await getAccessToken();
  const response = await fetch('/api/subscriptions/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ tierId }),
  });
  if (!response.ok) throw new Error(`Failed to create checkout: ${response.statusText}`);
  const json = await response.json();
  return json.data ?? json;
};

const createPortalSession = async (): Promise<{ url: string }> => {
  const accessToken = await getAccessToken();
  const response = await fetch('/api/subscriptions/portal', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Failed to create portal session: ${response.statusText}`);
  const json = await response.json();
  return json.data ?? json;
};

export const useSubscriptionTiers = () => {
  return useQuery({
    queryKey: queryKeys.subscriptions.tiers(),
    queryFn: fetchTiers,
    staleTime: 10 * 60 * 1000,
  });
};

export const useActiveSubscription = () => {
  return useQuery({
    queryKey: queryKeys.subscriptions.active(),
    queryFn: fetchActiveSubscription,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCheckout = () => {
  return useMutation({
    mutationFn: createCheckoutSession,
  });
};

export const useCreatePortalSession = () => {
  return useMutation({
    mutationFn: createPortalSession,
  });
};
