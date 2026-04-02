'use server';

import { requireAuth } from '@/app/_lib/auth';
import { type ActionResult, actionSuccess, actionError } from '@/app/_lib/action-utils';
import { membersService } from '@services/members';
import { rbacService } from '@services/rbac';
import { getOrCreateUser, syncWalletAddress, saveVerifiedWallet, removeWalletAddress } from '@core/database/queries/users';
import { db, members, users, membershipTiers, memberRoles, roles } from '@core/database';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { verifyMessage } from 'viem';

export async function listMembers() {
  await requireAuth();

  // Main member data with tier
  const rows = await db
    .select({
      id: members.id,
      userId: members.userId,
      username: users.username,
      avatarUrl: users.avatarUrl,
      walletAddress: users.walletAddress,
      membershipType: members.membershipType,
      contributionPoints: members.contributionPoints,
      votingPower: members.votingPower,
      status: members.status,
      joinedAt: members.joinedAt,
      firstName: members.firstName,
      lastName: members.lastName,
      jobTitle: members.jobTitle,
      employer: members.employer,
      city: members.city,
      state: members.state,
      industry: members.industry,
      skills: members.skills,
      bio: users.bio,
      linkedinUrl: members.linkedinUrl,
      twitterUrl: members.twitterUrl,
      githubUrl: members.githubUrl,
      websiteUrl: members.websiteUrl,
      civicInterests: members.civicInterests,
      availability: members.availability,
      tierName: membershipTiers.name,
      tierDisplayName: membershipTiers.displayName,
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .leftJoin(membershipTiers, eq(members.currentTierId, membershipTiers.id))
    .where(eq(members.status, 'active'))
    .orderBy(desc(members.contributionPoints));

  // Batch-fetch roles for all members in one query
  const memberIds = rows.map((r) => r.id);
  const allRoles = memberIds.length > 0
    ? await db
        .select({
          memberId: memberRoles.memberId,
          roleName: roles.name,
          roleDisplayName: roles.displayName,
          roleLevel: roles.level,
        })
        .from(memberRoles)
        .innerJoin(roles, eq(memberRoles.roleId, roles.id))
        .where(and(
          eq(memberRoles.isActive, true),
          inArray(memberRoles.memberId, memberIds)
        ))
    : [];

  // Group roles by member
  const rolesByMember = new Map<string, { name: string; displayName: string | null; level: number }[]>();
  for (const r of allRoles) {
    const list = rolesByMember.get(r.memberId) || [];
    list.push({ name: r.roleName, displayName: r.roleDisplayName, level: r.roleLevel });
    rolesByMember.set(r.memberId, list);
  }

  return rows.map((row) => {
    const memberRoleList = rolesByMember.get(row.id) || [];
    const highestRole = memberRoleList.sort((a, b) => b.level - a.level)[0] || null;

    const isPaid = row.tierName === 'monthly' || row.tierName === 'annual';

    return {
      ...row,
      standingLabel: isPaid ? 'Member' : 'Observer',
      standingTier: row.tierName || 'free',
      highestRole: highestRole?.name || 'guest',
      roleNames: memberRoleList.map((r) => r.displayName || r.name),
    };
  });
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

  const [memberWithTier, forumPosts, projects, meetingNotes, votesReceived] = await Promise.all([
    db
      .select({
        member: members,
        tierDisplayName: membershipTiers.displayName,
        tierName: membershipTiers.name,
      })
      .from(members)
      .leftJoin(membershipTiers, eq(members.currentTierId, membershipTiers.id))
      .where(eq(members.userId, user.id))
      .limit(1),
    db.execute(sql`SELECT COUNT(*) as count FROM forum_posts WHERE author_id = ${user.id} AND parent_id IS NULL`),
    db.execute(sql`SELECT COUNT(*) as count FROM projects WHERE creator_id = ${user.id}`),
    db.execute(sql`SELECT COUNT(*) as count FROM meeting_notes WHERE author_id = ${user.id}`),
    db.execute(sql`SELECT COUNT(*) as count FROM forum_votes fv INNER JOIN forum_posts fp ON fv.post_id = fp.id WHERE fp.author_id = ${user.id} AND fv.vote_type = 1`),
  ]);

  const row = memberWithTier[0];
  const memberData = row?.member;
  return {
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    },
    membership: {
      type: row?.tierDisplayName ?? row?.tierName ?? memberData?.membershipType ?? 'Free',
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
  walletAddress?: string;
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
      // Stripe customer creation is handled in the checkout route (single owner)
    }

    // Sync wallet address from Privy to users table
    if (data.walletAddress) {
      await syncWalletAddress(user.id, data.walletAddress).catch((err) => {
        console.error('[onboarding] Failed to sync wallet address:', err);
      });
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

// ── Wallet verification ──

const WALLET_VERIFY_PREFIX = 'FWTX DAO Wallet Verification\n\nI am verifying ownership of this wallet for my FWTX DAO account.\n\nWallet: ';

export async function verifyWallet(data: {
  walletAddress: string;
  signature: string;
  message: string;
}): Promise<ActionResult<{ walletAddress: string }>> {
  try {
    const { user } = await requireAuth();

    // Validate message format to prevent replay attacks
    if (!data.message.startsWith(WALLET_VERIFY_PREFIX)) {
      return actionError('Invalid verification message format');
    }

    // Extract address from message and ensure it matches
    const messageAddress = data.message.slice(WALLET_VERIFY_PREFIX.length).trim().toLowerCase();
    if (messageAddress !== data.walletAddress.toLowerCase()) {
      return actionError('Wallet address mismatch');
    }

    // Verify the signature using viem
    const valid = await verifyMessage({
      address: data.walletAddress as `0x${string}`,
      message: data.message,
      signature: data.signature as `0x${string}`,
    });

    if (!valid) {
      return actionError('Invalid signature — wallet ownership could not be verified');
    }

    // Save verified wallet
    await saveVerifiedWallet(user.id, data.walletAddress);
    revalidatePath('/settings');
    revalidatePath('/passport');

    return actionSuccess({ walletAddress: data.walletAddress });
  } catch (err) {
    return actionError(err);
  }
}

export async function disconnectWallet(): Promise<ActionResult<null>> {
  try {
    const { user } = await requireAuth();
    await removeWalletAddress(user.id);
    revalidatePath('/settings');
    revalidatePath('/passport');
    return actionSuccess(null);
  } catch (err) {
    return actionError(err);
  }
}

export async function getWalletStatus() {
  const { user } = await requireAuth();
  const result = await db
    .select({ walletAddress: users.walletAddress, walletVerifiedAt: users.walletVerifiedAt })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const row = result[0];
  return {
    walletAddress: row?.walletAddress ?? null,
    walletVerifiedAt: row?.walletVerifiedAt?.toISOString() ?? null,
  };
}

export async function getWalletVerifyMessage(walletAddress: string) {
  return `${WALLET_VERIFY_PREFIX}${walletAddress}`;
}
