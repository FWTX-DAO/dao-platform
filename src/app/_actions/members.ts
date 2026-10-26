"use server";

import { cookies } from "next/headers";
import { REFERRAL_COOKIE } from "@utils/referrals";
import { ValidationError } from "@core/errors";
import {
  completeMemberOnboarding,
  type OnboardingInput,
} from "@services/members/services/onboarding.service";

import { requireAuth, requireAdmin } from "@/app/_lib/auth";
import { getPreferredEthWalletFromAccounts } from "@utils/wallet";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/app/_lib/action-utils";
import { membersService } from "@services/members";
import {
  syncWalletAddress,
  saveVerifiedWallet,
  removeWalletAddress,
  invalidateUserCacheByUserId,
} from "@core/database/queries/users";
import { normalizeEmail } from "@utils/verified-email";
import {
  db,
  members,
  users,
  membershipTiers,
  memberRoles,
  roles,
} from "@core/database";
import { eq, and, sql, desc, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyMessage } from "viem";
import { PrivyClient } from "@privy-io/node";

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
    .where(eq(members.status, "active"))
    .orderBy(desc(members.contributionPoints));

  // Batch-fetch roles for all members in one query
  const memberIds = rows.map((r) => r.id);
  const allRoles =
    memberIds.length > 0
      ? await db
          .select({
            memberId: memberRoles.memberId,
            roleName: roles.name,
            roleDisplayName: roles.displayName,
            roleLevel: roles.level,
          })
          .from(memberRoles)
          .innerJoin(roles, eq(memberRoles.roleId, roles.id))
          .where(
            and(
              eq(memberRoles.isActive, true),
              inArray(memberRoles.memberId, memberIds),
            ),
          )
      : [];

  // Group roles by member
  const rolesByMember = new Map<
    string,
    { name: string; displayName: string | null; level: number }[]
  >();
  for (const r of allRoles) {
    const list = rolesByMember.get(r.memberId) || [];
    list.push({
      name: r.roleName,
      displayName: r.roleDisplayName,
      level: r.roleLevel,
    });
    rolesByMember.set(r.memberId, list);
  }

  return rows.map((row) => {
    const memberRoleList = rolesByMember.get(row.id) || [];
    const highestRole =
      memberRoleList.sort((a, b) => b.level - a.level)[0] || null;

    const isPaid = row.tierName === "monthly" || row.tierName === "annual";

    return {
      ...row,
      standingLabel: isPaid ? "Member" : "Observer",
      standingTier: row.tierName || "free",
      highestRole: highestRole?.name || "guest",
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
  const { user, verifiedEmail } = await requireAuth();
  try {
    if (
      !verifiedEmail ||
      (data.email !== undefined &&
        (typeof data.email !== "string" ||
          normalizeEmail(data.email) !== verifiedEmail))
    ) {
      throw new ValidationError(
        "Link and verify your email with Privy before saving it.",
      );
    }
    const result = await membersService.updateMemberProfile(user.id, {
      ...data,
      email: verifiedEmail,
    });
    revalidatePath("/passport");
    return actionSuccess(result);
  } catch (err) {
    return actionError(err);
  }
}

export async function getMemberStats() {
  const { user } = await requireAuth();

  // Ensure member exists
  await membersService.getOrCreateMember(user.id);

  const [memberWithTier, forumPosts, projects, meetingNotes, votesReceived] =
    await Promise.all([
      db
        .select({
          member: members,
          tierDisplayName: membershipTiers.displayName,
          tierName: membershipTiers.name,
        })
        .from(members)
        .leftJoin(
          membershipTiers,
          eq(members.currentTierId, membershipTiers.id),
        )
        .where(eq(members.userId, user.id))
        .limit(1),
      db.execute(
        sql`SELECT COUNT(*) as count FROM forum_posts WHERE author_id = ${user.id} AND parent_id IS NULL`,
      ),
      db.execute(
        sql`SELECT COUNT(*) as count FROM projects WHERE creator_id = ${user.id}`,
      ),
      db.execute(
        sql`SELECT COUNT(*) as count FROM meeting_notes WHERE author_id = ${user.id}`,
      ),
      db.execute(
        sql`SELECT COUNT(*) as count FROM forum_votes fv INNER JOIN forum_posts fp ON fv.post_id = fp.id WHERE fp.author_id = ${user.id} AND fv.vote_type = 1`,
      ),
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
      type:
        row?.tierDisplayName ??
        row?.tierName ??
        memberData?.membershipType ??
        "Free",
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

/** Complete profile, verified email, RBAC, and referral attribution atomically. */
export async function completeOnboarding(
  data: OnboardingInput,
): Promise<ActionResult<{ memberId: string; walletSyncError?: string }>> {
  const auth = await requireAuth();
  try {
    const result = await completeMemberOnboarding(
      auth.user.id,
      data,
      auth.verifiedEmail,
      auth.walletAddress,
    );
    invalidateUserCacheByUserId(auth.user.id);
    (await cookies()).delete(REFERRAL_COOKIE);
    for (const path of ["/dashboard", "/passport", "/settings"])
      revalidatePath(path);
    return actionSuccess(result);
  } catch (err) {
    const cause = err as {
      code?: string;
      constraint?: string;
      cause?: { code?: string; constraint?: string };
    };
    if ((cause.code ?? cause.cause?.code) === "23505")
      return actionError(
        new ValidationError(
          "That username or account detail is already in use. Please choose another.",
        ),
      );
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

const WALLET_VERIFY_PREFIX =
  "FWTX DAO Wallet Verification\n\nI am verifying ownership of this wallet for my FWTX DAO account.\n\nWallet: ";

export async function verifyWallet(data: {
  walletAddress: string;
  signature: string;
  message: string;
}): Promise<ActionResult<{ walletAddress: string }>> {
  try {
    const { user } = await requireAuth();

    // Validate message format to prevent replay attacks
    if (!data.message.startsWith(WALLET_VERIFY_PREFIX)) {
      return actionError("Invalid verification message format");
    }

    // Extract address from message and ensure it matches
    const messageAddress = data.message
      .slice(WALLET_VERIFY_PREFIX.length)
      .trim()
      .toLowerCase();
    if (messageAddress !== data.walletAddress.toLowerCase()) {
      return actionError("Wallet address mismatch");
    }

    // Verify the signature using viem
    const valid = await verifyMessage({
      address: data.walletAddress as `0x${string}`,
      message: data.message,
      signature: data.signature as `0x${string}`,
    });

    if (!valid) {
      return actionError(
        "Invalid signature — wallet ownership could not be verified",
      );
    }

    // Save verified wallet (throws if another user already owns it)
    await saveVerifiedWallet(user.id, data.walletAddress);
    revalidatePath("/settings");
    revalidatePath("/passport");
    revalidatePath("/members");
    revalidatePath("/directory");

    return actionSuccess({ walletAddress: data.walletAddress.toLowerCase() });
  } catch (err) {
    return actionError(err);
  }
}

export async function disconnectWallet(): Promise<ActionResult<null>> {
  try {
    const { user } = await requireAuth();
    await removeWalletAddress(user.id);
    revalidatePath("/settings");
    revalidatePath("/passport");
    revalidatePath("/members");
    revalidatePath("/directory");
    return actionSuccess(null);
  } catch (err) {
    return actionError(err);
  }
}

export async function getWalletVerifyMessage(walletAddress: string) {
  return `${WALLET_VERIFY_PREFIX}${walletAddress}`;
}

// ── Admin: backfill wallet addresses from Privy ──

export async function backfillWallets(): Promise<
  ActionResult<{ synced: number; failed: number; skipped: number }>
> {
  try {
    const { isAdmin } = await requireAdmin();
    if (!isAdmin) return actionError("Admin access required");

    const privy = new PrivyClient({
      appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
      appSecret: process.env.PRIVY_APP_SECRET!,
    });

    // Get all users missing a wallet address
    const usersWithoutWallet = await db
      .select({ id: users.id, privyDid: users.privyDid })
      .from(users)
      .where(isNull(users.walletAddress));

    let synced = 0;
    let failed = 0;
    let skipped = 0;

    for (const u of usersWithoutWallet) {
      try {
        const privyUser = await privy.users()._get(u.privyDid);
        const wallet = getPreferredEthWalletFromAccounts(
          privyUser?.linked_accounts,
        );

        if (wallet?.address) {
          await syncWalletAddress(u.id, wallet.address);
          synced++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`[backfill] Failed for user ${u.id}:`, err);
        failed++;
      }
    }

    revalidatePath("/members");
    return actionSuccess({ synced, failed, skipped });
  } catch (err) {
    return actionError(err);
  }
}
