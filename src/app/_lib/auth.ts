import { cookies } from 'next/headers';
import { PrivyClient } from '@privy-io/server-auth';
import { getOrCreateUser } from '@core/database/queries/users';
import { db } from '@core/database';
import { members, memberRoles, roles } from '@core/database/schema';
import { eq, and } from 'drizzle-orm';

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export async function getAuthUser() {
  const token = (await cookies()).get('privy-token')?.value;
  if (!token) return null;
  try {
    const claims = await privy.verifyAuthToken(token);
    const user = await getOrCreateUser(claims.userId, (claims as any).email);
    return { claims, user: user! };
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const auth = await getAuthUser();
  if (!auth) throw new Error('Unauthorized');
  return auth;
}

/**
 * Server-side entitlement check.
 * Returns true if user has at least member-level (level >= 10) RBAC role.
 */
export async function hasActiveMembership(userId: string): Promise<boolean> {
  const memberLevel = await db
    .select({ level: roles.level })
    .from(memberRoles)
    .innerJoin(members, eq(memberRoles.memberId, members.id))
    .innerJoin(roles, eq(memberRoles.roleId, roles.id))
    .where(and(eq(members.userId, userId), eq(memberRoles.isActive, true)))
    .orderBy(roles.level)
    .limit(1);
  return (memberLevel[0]?.level ?? 0) >= 10;
}
