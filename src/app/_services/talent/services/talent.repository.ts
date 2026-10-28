import {
  and,
  arrayOverlaps,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  sql,
  type AnyColumn,
  type SQL,
} from "drizzle-orm";
import { db, talentProfiles } from "@core/database";
import {
  TALENT_EXPORT_LIMIT,
  type TalentListQuery,
  type TalentProfile,
  type TalentSortColumn,
} from "../types";
import { escapeLikePattern } from "./talent-query";

const SORT_EXPRESSIONS: Record<TalentSortColumn, AnyColumn | SQL> = {
  createdAt: talentProfiles.createdAt,
  updatedAt: talentProfiles.updatedAt,
  fullName: sql`lower(${talentProfiles.fullName})`,
  location: sql`lower(${talentProfiles.location})`,
  status: talentProfiles.status,
};

export class TalentRepository {
  private buildWhere(query: TalentListQuery): SQL | undefined {
    const { search, status, interests, preferences } = query;
    const conditions: SQL[] = [];
    if (status !== "all") conditions.push(eq(talentProfiles.status, status));
    // Within a facet, any selected option matches.
    if (interests.length)
      conditions.push(
        arrayOverlaps(talentProfiles.opportunityInterests, interests),
      );
    if (preferences.length)
      conditions.push(
        arrayOverlaps(talentProfiles.workPreferences, preferences),
      );
    if (search) {
      const pattern = `%${escapeLikePattern(search)}%`;
      const match = or(
        ilike(talentProfiles.fullName, pattern),
        ilike(talentProfiles.email, pattern),
        ilike(talentProfiles.phone, pattern),
        ilike(talentProfiles.location, pattern),
        ilike(talentProfiles.currentWork, pattern),
        sql`array_to_string(${talentProfiles.skills}, ' ') ilike ${pattern}`,
      );
      if (match) conditions.push(match);
    }
    return conditions.length ? and(...conditions) : undefined;
  }

  /** Ties fall back to newest first, then id, so pages never overlap. */
  private buildOrderBy({ sort, dir }: TalentListQuery): SQL[] {
    const order = dir === "asc" ? asc : desc;
    return [
      order(SORT_EXPRESSIONS[sort]),
      desc(talentProfiles.createdAt),
      desc(talentProfiles.id),
    ];
  }

  async list(
    query: TalentListQuery,
  ): Promise<{ items: TalentProfile[]; total: number }> {
    const where = this.buildWhere(query);
    const [items, [totals]] = await Promise.all([
      db
        .select()
        .from(talentProfiles)
        .where(where)
        .orderBy(...this.buildOrderBy(query))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db.select({ total: count() }).from(talentProfiles).where(where),
    ]);
    return { items, total: Number(totals?.total ?? 0) };
  }

  /** Every row matching the filters, in table order, for CSV export. */
  async listForExport(query: TalentListQuery): Promise<TalentProfile[]> {
    return db
      .select()
      .from(talentProfiles)
      .where(this.buildWhere(query))
      .orderBy(...this.buildOrderBy(query))
      .limit(TALENT_EXPORT_LIMIT);
  }
}
