'use server';

import { requireAuth, isUserAdmin } from '@/app/_lib/auth';
import { type ActionResult, actionError } from '@/app/_lib/action-utils';
import { stampsService } from '@services/stamps';
import { membersService } from '@services/members';
import { IssueStampsSchema, type IssueStampsInput, type IssueStampsResult } from '@services/stamps';
import { revalidatePath } from 'next/cache';

export async function getMyStamps() {
  const { user } = await requireAuth();
  const member = await membersService.getMemberByUserId(user.id);
  return stampsService.getStampsForMember(member.id);
}

export async function getMemberStamps(memberId: string) {
  await requireAuth();
  return stampsService.getStampsForMember(memberId);
}

export async function issueStamps(
  input: IssueStampsInput,
): Promise<ActionResult<IssueStampsResult>> {
  try {
    const { user } = await requireAuth();
    const admin = await isUserAdmin(user.id);
    if (!admin) {
      return { success: false, error: 'You do not have permission to issue stamps' };
    }

    const validated = IssueStampsSchema.parse(input);
    const result = await stampsService.issueStampsByEmail(validated, user.id);
    revalidatePath('/passport');
    return { success: true, data: result };
  } catch (err) {
    return actionError(err);
  }
}
