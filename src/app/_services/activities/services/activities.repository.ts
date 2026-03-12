import { db } from '@core/database';
import { memberActivities, members, users } from '@core/database/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { generateId } from '@shared/utils';
import type { ActivityFilters } from '../types';

export class ActivitiesRepository {
  async create(data: {
    memberId: string;
    activityType: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: unknown;
    pointsAwarded: number;
  }) {
    const id = generateId();
    const now = new Date();

    await db.insert(memberActivities).values({
      id,
      memberId: data.memberId,
      activityType: data.activityType,
      resourceType: data.resourceType ?? null,
      resourceId: data.resourceId ?? null,
      metadata: data.metadata ?? null,
      pointsAwarded: data.pointsAwarded,
      createdAt: now,
    });

    return { id, ...data, createdAt: now };
  }

  async findByMember(memberId: string, filters?: ActivityFilters) {
    const conditions = [eq(memberActivities.memberId, memberId)];

    if (filters?.activityType) {
      conditions.push(eq(memberActivities.activityType, filters.activityType));
    }
    if (filters?.startDate) {
      conditions.push(gte(memberActivities.createdAt, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      conditions.push(lte(memberActivities.createdAt, new Date(filters.endDate)));
    }

    return db
      .select()
      .from(memberActivities)
      .where(and(...conditions))
      .orderBy(desc(memberActivities.createdAt))
      .limit(filters?.limit ?? 50)
      .offset(filters?.offset ?? 0);
  }

  async findRecent(limit = 20) {
    return db
      .select({
        id: memberActivities.id,
        memberId: memberActivities.memberId,
        activityType: memberActivities.activityType,
        resourceType: memberActivities.resourceType,
        resourceId: memberActivities.resourceId,
        metadata: memberActivities.metadata,
        pointsAwarded: memberActivities.pointsAwarded,
        createdAt: memberActivities.createdAt,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(memberActivities)
      .innerJoin(members, eq(memberActivities.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .orderBy(desc(memberActivities.createdAt))
      .limit(limit);
  }

  async getStatsByMember(memberId: string) {
    return db
      .select({
        activityType: memberActivities.activityType,
        count: sql<number>`COUNT(*)`,
        totalPoints: sql<number>`SUM(${memberActivities.pointsAwarded})`,
      })
      .from(memberActivities)
      .where(eq(memberActivities.memberId, memberId))
      .groupBy(memberActivities.activityType);
  }
}

export const activitiesRepository = new ActivitiesRepository();
