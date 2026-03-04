'use server';

import { requireAuth } from '@/app/_lib/auth';
import { type ActionResult, actionError } from '@/app/_lib/action-utils';
import { stampsService } from '@services/stamps';
import { membersService } from '@services/members';
import { IssueStampsSchema, type IssueStampsInput, type IssueStampsResult } from '@services/stamps';
import { db } from '@core/database';
import { members, memberRoles, roles } from '@core/database/schema';
import { eq, and, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

async function isUserAdmin(userId: string) {
  const adminRoles = await db
    .select()
    .from(memberRoles)
    .innerJoin(members, eq(memberRoles.memberId, members.id))
    .innerJoin(roles, eq(memberRoles.roleId, roles.id))
    .where(
      and(
        eq(members.userId, userId),
        or(eq(roles.name, 'council_member'), eq(roles.name, 'screener'), eq(roles.name, 'admin'))
      )
    )
    .limit(1);
  return adminRoles.length > 0;
}

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
