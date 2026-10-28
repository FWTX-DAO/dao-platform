import { TalentService } from "./services/talent.service";
import { TalentRepository } from "./services/talent.repository";

export const talentRepository = new TalentRepository();
export type {
  TalentFilters,
  TalentListParams,
  TalentListResult,
  TalentProfile,
  TalentStatusFilter,
} from "./types";

export const talentService = new TalentService(talentRepository);
