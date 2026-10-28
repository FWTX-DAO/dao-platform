import type { TalentProfile, TalentStatus } from "@core/database/talent-schema";

export type { TalentProfile, TalentStatus };

export const TALENT_STATUS_FILTERS = [
  "all",
  "verified",
  "archived",
] as const satisfies readonly ("all" | TalentStatus)[];
export type TalentStatusFilter = (typeof TALENT_STATUS_FILTERS)[number];

// Mirrors the choices offered by talent-web-form (lib/talent.ts).
export const OPPORTUNITY_INTERESTS = [
  "full-time",
  "contract",
  "cofounding",
  "advising",
  "volunteering",
  "collaboration",
] as const;
export type OpportunityInterest = (typeof OPPORTUNITY_INTERESTS)[number];

export const WORK_PREFERENCES = [
  "in-person",
  "hybrid",
  "remote",
  "fort-worth-first",
] as const;
export type WorkPreference = (typeof WORK_PREFERENCES)[number];

export const TALENT_OPTION_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  contract: "Contract",
  cofounding: "Cofounding",
  advising: "Advising",
  volunteering: "Volunteering",
  collaboration: "Collaboration",
  "in-person": "In-person",
  hybrid: "Hybrid",
  remote: "Remote",
  "fort-worth-first": "Fort Worth first",
};

/** Column ids the server can sort by; they match the table's column ids. */
export const TALENT_SORT_COLUMNS = [
  "createdAt",
  "updatedAt",
  "fullName",
  "location",
  "status",
] as const;
export type TalentSortColumn = (typeof TALENT_SORT_COLUMNS)[number];
export type SortDirection = "asc" | "desc";

export const TALENT_PAGE_SIZES = [10, 25, 50, 100] as const;
export const TALENT_PAGE_SIZE = 25;
export const TALENT_MAX_PAGE_SIZE = 100;
export const TALENT_MAX_SEARCH_LENGTH = 200;
export const TALENT_EXPORT_LIMIT = 10_000;

export interface TalentFilters {
  search?: string;
  status?: TalentStatusFilter;
  interests?: string[];
  preferences?: string[];
  sort?: TalentSortColumn;
  dir?: SortDirection;
}

export interface TalentListParams extends TalentFilters {
  page?: number;
  pageSize?: number;
}

export interface TalentListQuery {
  search: string;
  status: TalentStatusFilter;
  interests: OpportunityInterest[];
  preferences: WorkPreference[];
  sort: TalentSortColumn;
  dir: SortDirection;
  page: number;
  pageSize: number;
}

export interface TalentListResult {
  items: TalentProfile[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
