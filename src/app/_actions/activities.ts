'use server';

import { requireAuth } from '@/app/_lib/auth';
import { activitiesService } from '@services/activities';
import { membersService } from '@services/members';

export async function getMyActivities(options?: { type?: string; limit?: number; offset?: number }) {
  const { user } = await requireAuth();
  const member = await membersService.getMemberByUserId(user.id);
  return activitiesService.getActivityFeed(member.id, options);
}

export async function getPlatformFeed(limit?: number) {
  await requireAuth();
  return activitiesService.getPlatformFeed(limit);
}

export async function getMemberActivities(
  memberId: string,
  options?: { type?: string; limit?: number; offset?: number }
) {
  await requireAuth();
  return activitiesService.getActivityFeed(memberId, options);
}
