import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  members,
  referralCodes,
  referrals,
  type Transaction,
} from "@core/database";
import { generateId } from "@utils/id-generator";
import { normalizeEmail } from "@utils/verified-email";
import {
  normalizeReferralCode,
  REFERRAL_SIGNUP_POINTS,
  membershipReferralPoints,
} from "@utils/referrals";
import { ValidationError } from "@core/errors";
import { ReferralsRepository } from "./referrals.repository";

export class ReferralsService {
  constructor(private repository: ReferralsRepository) {}

  async attributeSignup(
    tx: Transaction,
    memberId: string,
    email: string,
    rawCode: string,
  ) {
    const code = normalizeReferralCode(rawCode);
    if (!code)
      throw new ValidationError(
        "This referral code is invalid. Check it or clear the field to continue.",
      );
    const [referrer] = await tx
      .select({ id: members.id, email: members.email })
      .from(referralCodes)
      .innerJoin(members, eq(members.userId, referralCodes.userId))
      .where(
        and(
          eq(referralCodes.code, code),
          eq(members.onboardingStatus, "completed"),
          eq(members.status, "active"),
        ),
      );
    if (!referrer)
      throw new ValidationError(
        "This invitation is no longer available. Clear the referral code to continue.",
      );
    if (
      referrer.id === memberId ||
      (referrer.email &&
        normalizeEmail(referrer.email) === normalizeEmail(email))
    ) {
      throw new ValidationError("You cannot use your own referral code.");
    }
    const emailHash = createHash("sha256")
      .update(normalizeEmail(email))
      .digest("hex");
    const [referral] = await tx
      .insert(referrals)
      .values({
        id: generateId(),
        referrerMemberId: referrer.id,
        referredMemberId: memberId,
        referredEmailHash: emailHash,
      })
      .onConflictDoNothing()
      .returning();
    // Existing member/email attribution is never moved to a different inviter.
    if (referral)
      await this.repository.award(tx, referral, {
        sourceKey: `signup:${referral.id}`,
        kind: "observer_signup",
        points: REFERRAL_SIGNUP_POINTS,
      });
  }

  async awardMembership(
    tx: Transaction,
    memberId: string,
    invoiceId: string,
    amountCents: number,
    paidAt: Date,
    feeCents: number,
    interval: string,
  ) {
    const [referral] = await tx
      .select()
      .from(referrals)
      .where(eq(referrals.referredMemberId, memberId));
    if (
      !referral ||
      Math.floor(paidAt.getTime() / 1000) <
        Math.floor(referral.createdAt.getTime() / 1000)
    )
      return;
    const points = membershipReferralPoints(amountCents, feeCents, interval);
    if (!points) return;
    await this.repository.award(tx, referral, {
      sourceKey: `invoice:${invoiceId}`,
      kind: "membership_payment",
      points,
      amountCents,
      stripeInvoiceId: invoiceId,
    });
  }
}
