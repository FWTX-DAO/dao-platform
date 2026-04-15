import { z } from "zod";
import type { Subscription, MembershipTier } from "@core/database/schema";

export const CreateSubscriptionSchema = z.object({
  tierId: z.string().min(1),
  stripeSubscriptionId: z.string().optional(),
  stripeCustomerId: z.string().min(1),
});

export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;

export interface SubscriptionWithTier extends Subscription {
  tier: MembershipTier;
}

export interface TierInfo {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  priceCents: number;
  billingInterval: string;
  features: string | null;
}
