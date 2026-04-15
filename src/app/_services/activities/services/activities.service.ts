import { db } from "@core/database";
import { members } from "@core/database/schema";
import { eq, sql } from "drizzle-orm";
import { ACTIVITY_POINTS, type ACTIVITY_TYPES } from "@shared/constants";
import { ActivitiesRepository } from "./activities.repository";
import type { ActivityFilters } from "../types";

type ActivityType = (typeof ACTIVITY_TYPES)[number];

export class ActivitiesService {
  constructor(private repository: ActivitiesRepository) {}

  /**
   * Track a user activity — resolves member from userId (Privy DID),
   * awards contribution points atomically, and creates the activity record.
   *
   * Silently returns null if the user has no member record (don't break callers).
   */
  async trackActivity(
    userId: string,
    activityType: ActivityType,
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, unknown>,
  ) {
    // Resolve member
    const member = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.userId, userId))
      .limit(1)
      .then((r) => r[0]);

    if (!member) return null;

    const points = ACTIVITY_POINTS[activityType] ?? 0;

    // Create activity record
    const activity = await this.repository.create({
      memberId: member.id,
      activityType,
      resourceType,
      resourceId,
      metadata: metadata ?? undefined,
      pointsAwarded: points,
    });

    // Atomically increment contribution points
    if (points > 0) {
      await db
        .update(members)
        .set({
          contributionPoints: sql`${members.contributionPoints} + ${points}`,
          updatedAt: new Date(),
        })
        .where(eq(members.id, member.id));
    }

    return activity;
  }

  async getActivityFeed(memberId: string, filters?: ActivityFilters) {
    return this.repository.findByMember(memberId, filters);
  }

  async getPlatformFeed(limit?: number) {
    return this.repository.findRecent(limit);
  }

  async getMemberActivityStats(memberId: string) {
    return this.repository.getStatsByMember(memberId);
  }
}

export const activitiesService = new ActivitiesService(
  new ActivitiesRepository(),
);
