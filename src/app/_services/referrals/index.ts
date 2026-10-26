import { ReferralsService } from "./services/referrals.service";
import { ReferralsRepository } from "./services/referrals.repository";

export const referralsRepository = new ReferralsRepository();
export type { ReferralSummary } from "./types";

export const referralsService = new ReferralsService(referralsRepository);
