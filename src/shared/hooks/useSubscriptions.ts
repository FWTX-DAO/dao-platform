import { useQuery, useMutation } from "@tanstack/react-query";
import { getAccessToken } from "@privy-io/react-auth";
import {
  getSubscriptionTiers as getTiersAction,
  getActiveSubscription as getActiveSubAction,
} from "@/app/_actions/subscriptions";
import { queryKeys } from "@shared/constants/query-keys";
import { useAuthReady } from "./useAuthReady";

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

export const useSubscriptionTiers = () => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.subscriptions.tiers(),
    queryFn: () => getTiersAction() as unknown as Promise<SubscriptionTier[]>,
    enabled: authReady,
    staleTime: 10 * 60 * 1000,
  });
};

export const useActiveSubscription = () => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.subscriptions.active(),
    queryFn: () =>
      getActiveSubAction() as unknown as Promise<ActiveSubscription | null>,
    enabled: authReady,
    staleTime: 5 * 60 * 1000,
  });
};

// Stripe checkout/portal remain as fetch calls since they involve external redirects
const createCheckoutSession = async (
  tierId: string,
): Promise<{ url: string }> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/subscriptions/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ tierId }),
  });
  if (!response.ok)
    throw new Error(`Failed to create checkout: ${response.statusText}`);
  const json = await response.json();
  return json.data ?? json;
};

const createPortalSession = async (): Promise<{ url: string }> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/subscriptions/portal", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok)
    throw new Error(`Failed to create portal session: ${response.statusText}`);
  const json = await response.json();
  return json.data ?? json;
};

export const useCreateCheckout = () => {
  return useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });
};

export const useCreatePortalSession = () => {
  return useMutation({
    mutationFn: createPortalSession,
  });
};
