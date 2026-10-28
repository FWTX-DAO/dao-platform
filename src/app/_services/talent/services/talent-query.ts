import {
  OPPORTUNITY_INTERESTS,
  TALENT_MAX_PAGE_SIZE,
  TALENT_MAX_SEARCH_LENGTH,
  TALENT_PAGE_SIZE,
  TALENT_SORT_COLUMNS,
  TALENT_STATUS_FILTERS,
  WORK_PREFERENCES,
  type TalentFilters,
  type TalentListParams,
  type TalentListQuery,
} from "../types";

/** Escapes LIKE wildcards so a search for "50%" or "a_b" matches literally. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function isOneOf<T extends string>(
  value: unknown,
  options: readonly T[],
): value is T {
  return (
    typeof value === "string" && (options as readonly string[]).includes(value)
  );
}

/** Keeps only known options, deduped and in canonical order. */
function pickOptions<T extends string>(
  values: unknown,
  options: readonly T[],
): T[] {
  if (!Array.isArray(values)) return [];
  return options.filter((option) => values.includes(option));
}

function toPositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback;
}

/** Server actions accept untrusted input, so every list param is clamped. */
export function normalizeTalentListParams(
  params: TalentListParams = {},
): TalentListQuery {
  const sort = isOneOf(params.sort, TALENT_SORT_COLUMNS)
    ? params.sort
    : "createdAt";
  const defaultDir =
    sort === "createdAt" || sort === "updatedAt" ? "desc" : "asc";
  return {
    search:
      typeof params.search === "string"
        ? params.search.trim().slice(0, TALENT_MAX_SEARCH_LENGTH)
        : "",
    status: isOneOf(params.status, TALENT_STATUS_FILTERS)
      ? params.status
      : "all",
    interests: pickOptions(params.interests, OPPORTUNITY_INTERESTS),
    preferences: pickOptions(params.preferences, WORK_PREFERENCES),
    sort,
    dir: isOneOf(params.dir, ["asc", "desc"] as const)
      ? params.dir
      : defaultDir,
    page: toPositiveInt(params.page, 1),
    pageSize: Math.min(
      toPositiveInt(params.pageSize, TALENT_PAGE_SIZE),
      TALENT_MAX_PAGE_SIZE,
    ),
  };
}

/** Serializes filters + sort for the CSV export URL. */
export function talentFiltersToSearchParams(
  filters: TalentFilters,
): URLSearchParams {
  const query = normalizeTalentListParams(filters);
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status !== "all") params.set("status", query.status);
  if (query.interests.length)
    params.set("interests", query.interests.join(","));
  if (query.preferences.length)
    params.set("preferences", query.preferences.join(","));
  params.set("sort", query.sort);
  params.set("dir", query.dir);
  return params;
}

export function talentQueryFromSearchParams(
  params: URLSearchParams,
): TalentListQuery {
  const list = (key: string) => params.get(key)?.split(",") ?? [];
  return normalizeTalentListParams({
    search: params.get("search") ?? "",
    status: params.get("status"),
    interests: list("interests"),
    preferences: list("preferences"),
    sort: params.get("sort"),
    dir: params.get("dir"),
  } as TalentListParams);
}
