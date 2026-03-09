'use server';

import Stripe from 'stripe';
import { requireAuth } from '@/app/_lib/auth';
import { type ActionResult, actionSuccess, actionError } from '@/app/_lib/action-utils';
import { membersService } from '@services/members';
import { rbacService } from '@services/rbac';
import { getOrCreateUser } from '@core/database/queries/users';
import { db, members, users } from '@core/database';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

let _stripe: Stripe | null = null;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });
  return _stripe;
}

export async function listMembers() {
  await requireAuth();
  const result = await db
    .select({
      id: members.id,
      userId: members.userId,
      username: users.username,
      avatarUrl: users.avatarUrl,
      membershipType: members.membershipType,
      contributionPoints: members.contributionPoints,
      votingPower: members.votingPower,
      status: members.status,
      joinedAt: members.joinedAt,
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(members.status, 'active'));
  return result;
}

export async function getMemberProfile() {
  const { user } = await requireAuth();
  await membersService.getOrCreateMember(user.id);
  return membersService.getMemberWithProfile(user.id);
}

export async function updateMemberProfile(data: Record<string, unknown>) {
  const { user } = await requireAuth();
  const result = await membersService.updateMemberProfile(user.id, data as any);
  revalidatePath('/passport');
  return result;
}

export async function getMemberStats() {
  const { user } = await requireAuth();

  // Ensure member exists
  await membersService.getOrCreateMember(user.id);

  const [member, forumPosts, projects, meetingNotes, votesReceived] = await Promise.all([
    db.select().from(members).where(eq(members.userId, user.id)).limit(1),
    db.execute(sql`SELECT COUNT(*) as count FROM forum_posts WHERE author_id = ${user.id} AND parent_id IS NULL`),
    db.execute(sql`SELECT COUNT(*) as count FROM projects WHERE creator_id = ${user.id}`),
    db.execute(sql`SELECT COUNT(*) as count FROM meeting_notes WHERE author_id = ${user.id}`),
    db.execute(sql`SELECT COUNT(*) as count FROM forum_votes fv INNER JOIN forum_posts fp ON fv.post_id = fp.id WHERE fp.author_id = ${user.id} AND fv.vote_type = 1`),
  ]);

  const memberData = member[0];
  return {
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    },
    membership: {
      type: memberData?.membershipType ?? 'basic',
      contributionPoints: memberData?.contributionPoints ?? 0,
      votingPower: memberData?.votingPower ?? 1,
    },
    stats: {
      forumPosts: Number((forumPosts as any)?.rows?.[0]?.count ?? 0),
      projects: Number((projects as any)?.rows?.[0]?.count ?? 0),
      meetingNotes: Number((meetingNotes as any)?.rows?.[0]?.count ?? 0),
      votesReceived: Number((votesReceived as any)?.rows?.[0]?.count ?? 0),
    },
  };
}

export async function completeOnboarding(data: {
  firstName: string;
  lastName: string;
  email: string;
  termsAccepted: true;
  phone?: string;
  employer?: string;
  jobTitle?: string;
  industry?: string;
  civicInterests?: string;
  skills?: string;
  availability?: string;
  city?: string;
  state?: string;
  zip?: string;
}): Promise<ActionResult<any>> {
  try {
    const { claims, user } = await requireAuth();

    const email = (claims as any).email || undefined;
    await getOrCreateUser(claims.userId, email);
    const member = await membersService.getOrCreateMember(user.id);

    if (member) {
      // Assign guest RBAC role for new free members (idempotent)
      const existingRoles = await rbacService.getMemberRoles(member.id);
      if (existingRoles.length === 0) {
        await rbacService.assignRole(member.id, 'guest');
      }

      // Create Stripe customer for all users (pre-registers for future upgrades)
      if (!member.stripeCustomerId) {
        try {
          const stripe = getStripe();
          const customer = await stripe.customers.create({
            email: data.email,
            name: `${data.firstName} ${data.lastName}`,
            metadata: { userId: user.id, memberId: member.id },
          });
          await db
            .update(members)
            .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
            .where(eq(members.id, member.id));
        } catch (err) {
          // Non-blocking — don't fail onboarding if Stripe is down
          console.error('Failed to create Stripe customer during onboarding:', err);
        }
      }
    }

    const result = await membersService.completeOnboarding(user.id, data);
    revalidatePath('/dashboard');
    return actionSuccess(result);
  } catch (err) {
    return actionError(err);
  }
}

export async function searchMembers(filters: {
  city?: string;
  industry?: string;
  availability?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  await requireAuth();
  return membersService.searchMembers(filters);
}
