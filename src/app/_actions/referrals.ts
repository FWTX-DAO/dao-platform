"use server";

import { requireAuth } from "@/app/_lib/auth";
import { referralsRepository } from "@services/referrals";

export async function getReferralSummary() {
  const { user } = await requireAuth();
  return referralsRepository.getSummary(user.id);
}
