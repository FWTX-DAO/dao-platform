import { desc, eq, sql } from "drizzle-orm";
import {
  db,
  members,
  referralCodes,
  referrals,
  referralRewards,
  memberActivities,
  type Transaction,
} from "@core/database";
import { generateId } from "@utils/id-generator";
import type { ReferralSummary } from "../types";

export class ReferralsRepository {
  async ensureCode(
    userId: string,
    tx: Transaction | typeof db = db,
  ): Promise<string> {
    await tx
      .insert(referralCodes)
      .values({ userId, code: generateId().replaceAll("-", "").toUpperCase() })
      .onConflictDoNothing({ target: referralCodes.userId });
    const [row] = await tx
      .select({ code: referralCodes.code })
      .from(referralCodes)
      .where(eq(referralCodes.userId, userId));
    if (!row) throw new Error("Referral code could not be created");
    return row.code;
  }

  async award(
    tx: Transaction,
    referral: typeof referrals.$inferSelect,
    reward: {
      sourceKey: string;
      kind: string;
      points: number;
      amountCents?: number;
      stripeInvoiceId?: string;
    },
  ) {
    const [inserted] = await tx
      .insert(referralRewards)
      .values({ id: generateId(), referralId: referral.id, ...reward })
      .onConflictDoNothing()
      .returning({ id: referralRewards.id });
    if (!inserted) return;
    await tx
      .update(members)
      .set({
        contributionPoints: sql`${members.contributionPoints} + ${reward.points}`,
        updatedAt: new Date(),
      })
      .where(eq(members.id, referral.referrerMemberId));
    await tx.insert(memberActivities).values({
      id: generateId(),
      memberId: referral.referrerMemberId,
      activityType:
        reward.kind === "observer_signup"
          ? "referral_signup"
          : "referral_membership",
      resourceType: "referral",
      resourceId: referral.id,
      pointsAwarded: reward.points,
      metadata: { rewardId: inserted.id },
    });
  }

  async getSummary(userId: string): Promise<ReferralSummary> {
    const code = await this.ensureCode(userId);
    const [member] = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.userId, userId));
    if (!member)
      return {
        code,
        invitedMembers: 0,
        paidMembers: 0,
        earnedPoints: 0,
        recentRewards: [],
      };
    const [counts] = await db
      .select({
        invitedMembers: sql<number>`count(distinct ${referrals.id})`,
        paidMembers: sql<number>`count(distinct ${referrals.id}) filter (where ${referralRewards.kind} = 'membership_payment')`,
        earnedPoints: sql<number>`coalesce(sum(${referralRewards.points}), 0)`,
      })
      .from(referrals)
      .leftJoin(referralRewards, eq(referralRewards.referralId, referrals.id))
      .where(eq(referrals.referrerMemberId, member.id));
    const recentRewards = await db
      .select({
        id: referralRewards.id,
        kind: referralRewards.kind,
        points: referralRewards.points,
        createdAt: referralRewards.createdAt,
      })
      .from(referralRewards)
      .innerJoin(referrals, eq(referrals.id, referralRewards.referralId))
      .where(eq(referrals.referrerMemberId, member.id))
      .orderBy(desc(referralRewards.createdAt))
      .limit(5);
    return {
      code,
      invitedMembers: Number(counts?.invitedMembers ?? 0),
      paidMembers: Number(counts?.paidMembers ?? 0),
      earnedPoints: Number(counts?.earnedPoints ?? 0),
      recentRewards,
    };
  }
}
