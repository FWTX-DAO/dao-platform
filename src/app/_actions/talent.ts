"use server";

import { requireAdmin } from "@/app/_lib/auth";
import { talentService, type TalentListParams } from "@services/talent";

export async function getTalentProfiles(params?: TalentListParams) {
  await requireAdmin();
  return talentService.listProfiles(params);
}
