import { and, eq } from "drizzle-orm";
import { db, users, members, roles, memberRoles } from "@core/database";
import { ValidationError } from "@core/errors";
import { generateId } from "@utils/id-generator";
import { normalizeEmail } from "@utils/verified-email";
import { validateUsernameFormat } from "@utils/onboarding";
import { referralsRepository, referralsService } from "@services/referrals";
import {
  CompleteOnboardingSchema,
  type CompleteOnboardingInput,
} from "../types";

export type OnboardingInput = CompleteOnboardingInput & {
  username: string;
  referralCode?: string;
  walletAddress?: string;
};

/** Privy verifies ownership first; all local completion writes share one transaction. */
export async function completeMemberOnboarding(
  userId: string,
  data: OnboardingInput,
  verifiedEmail: string | null,
  verifiedWallet?: string,
) {
  const username = validateUsernameFormat(data.username);
  if (!username.valid)
    throw new ValidationError(username.error ?? "Invalid username");
  if (!verifiedEmail || normalizeEmail(data.email) !== verifiedEmail) {
    throw new ValidationError(
      "Verify your email with Privy before completing your profile.",
    );
  }
  const result = CompleteOnboardingSchema.safeParse({
    ...data,
    email: verifiedEmail,
  });
  if (!result.success)
    throw new ValidationError(
      result.error.issues[0]?.message ?? "Check your profile details.",
    );
  const { termsAccepted: _termsAccepted, ...profile } = result.data;

  return db.transaction(async (tx) => {
    // Serializes retries and concurrent completions for this user.
    const [user] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .for("update");
    if (!user)
      throw new ValidationError("Your account is no longer available.");
    await tx
      .update(users)
      .set({ username: data.username.trim(), updatedAt: new Date() })
      .where(eq(users.id, userId));
    await tx
      .insert(members)
      .values({ id: generateId(), userId })
      .onConflictDoNothing({ target: members.userId });
    const [member] = await tx
      .select()
      .from(members)
      .where(eq(members.userId, userId));
    if (!member) throw new Error("Member missing after creation");
    let walletSyncError: string | undefined;
    if (verifiedWallet) {
      try {
        // A savepoint is required: catching a SQL error alone leaves PostgreSQL's transaction aborted.
        await tx.transaction(async (savepoint) => {
          await savepoint
            .update(users)
            .set({
              walletAddress: verifiedWallet.toLowerCase(),
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
        });
      } catch {
        walletSyncError =
          "Your profile was saved, but the wallet could not be linked. Review it in Settings.";
      }
    }
    await tx
      .update(members)
      .set({
        ...profile,
        emailVerifiedAt: new Date(),
        onboardingStatus: "completed",
        termsAcceptedAt: member.termsAcceptedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(members.id, member.id));
    const [role] = await tx
      .select({ id: memberRoles.id })
      .from(memberRoles)
      .where(
        and(
          eq(memberRoles.memberId, member.id),
          eq(memberRoles.isActive, true),
        ),
      )
      .limit(1);
    if (!role) {
      const [guest] = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, "guest"));
      if (!guest) throw new Error("Default guest role is not configured");
      await tx
        .insert(memberRoles)
        .values({ id: generateId(), memberId: member.id, roleId: guest.id });
    }
    await referralsRepository.ensureCode(userId, tx);
    if (
      member.onboardingStatus !== "completed" &&
      !member.termsAcceptedAt &&
      data.referralCode?.trim()
    ) {
      await referralsService.attributeSignup(
        tx,
        member.id,
        verifiedEmail,
        data.referralCode,
      );
    }
    return { memberId: member.id, walletSyncError };
  });
}
