'use server';

import { requireAuth } from '@/app/_lib/auth';
import { membersService } from '@features/members';
import { getOrCreateUser } from '@core/database/queries/users';
import { db, members, users } from '@core/database';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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
  revalidatePath('/profile');
  return result;
}

export async function getMemberStats() {
  const { user } = await requireAuth();

  // Ensure member exists
  await membersService.getOrCreateMember(user.id);

  const [member, forumPosts, projects, meetingNotes, votesReceived] = await Promise.all([
    db.select().from(members).where(eq(members.userId, user.id)).limit(1),
    db.select({ count: db.$count(db.select().from(members)) }).from(members).limit(0).then(() => {
      // Use raw count query
      return db.execute<{ count: number }>(
        `SELECT COUNT(*) as count FROM forum_posts WHERE author_id = '${user.id}' AND parent_id IS NULL`
      );
    }),
    db.execute<{ count: number }>(
      `SELECT COUNT(*) as count FROM projects WHERE creator_id = '${user.id}'`
    ),
    db.execute<{ count: number }>(
      `SELECT COUNT(*) as count FROM meeting_notes WHERE author_id = '${user.id}'`
    ),
    db.execute<{ count: number }>(
      `SELECT COUNT(*) as count FROM forum_votes fv INNER JOIN forum_posts fp ON fv.post_id = fp.id WHERE fp.author_id = '${user.id}' AND fv.vote_type = 1`
    ),
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
}) {
  const { claims, user } = await requireAuth();

  const email = (claims as any).email || undefined;
  await getOrCreateUser(claims.userId, email);
  await membersService.getOrCreateMember(user.id);

  const result = await membersService.completeOnboarding(user.id, data);
  revalidatePath('/dashboard');
  return result;
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
