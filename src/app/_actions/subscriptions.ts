'use server';

import { requireAuth } from '@/app/_lib/auth';
import { membersService } from '@features/members';
import { subscriptionsService } from '@features/subscriptions';

export async function getSubscriptionTiers() {
  return subscriptionsService.getActiveTiers();
}

export async function getActiveSubscription() {
  const { user } = await requireAuth();
  const member = await membersService.getOrCreateMember(user.id);
  if (!member) return null;
  return subscriptionsService.getActiveSubscription(member.id);
}
