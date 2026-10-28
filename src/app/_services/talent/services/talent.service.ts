import { TalentRepository } from "./talent.repository";
import { normalizeTalentListParams } from "./talent-query";
import type {
  TalentListParams,
  TalentListQuery,
  TalentListResult,
  TalentProfile,
} from "../types";

export class TalentService {
  constructor(private repository: TalentRepository) {}

  async listProfiles(params?: TalentListParams): Promise<TalentListResult> {
    const query = normalizeTalentListParams(params);
    const { items, total } = await this.repository.list(query);
    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async exportProfiles(query: TalentListQuery): Promise<TalentProfile[]> {
    return this.repository.listForExport(query);
  }
}
