import { db } from '@core/database';
import { members, users } from '@core/database/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { generateId } from '@shared/utils';
import type { UpdateMembershipInput } from '../types';

export class MembersRepository {
  async findAll() {
    return db
      .select({
        id: members.id,
        userId: members.userId,
        membershipType: members.membershipType,
        joinedAt: members.joinedAt,
        expiresAt: members.expiresAt,
        contributionPoints: members.contributionPoints,
        votingPower: members.votingPower,
        badges: members.badges,
        specialRoles: members.specialRoles,
        status: members.status,
        username: users.username,
        avatarUrl: users.avatarUrl,
        createdAt: members.createdAt,
        updatedAt: members.updatedAt,
      })
      .from(members)
      .leftJoin(users, eq(members.userId, users.id))
      .orderBy(desc(members.contributionPoints));
  }

  async findByUserId(userId: string) {
    const results = await db
      .select()
      .from(members)
      .where(eq(members.userId, userId))
      .limit(1);
    
    return results[0] ?? null;
  }

  async create(userId: string, membershipType: string = 'basic') {
    const id = generateId();
    await db.insert(members).values({
      id,
      userId,
      membershipType,
      contributionPoints: 0,
      votingPower: 1,
      status: 'active',
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return this.findByUserId(userId);
  }

  async update(userId: string, data: UpdateMembershipInput) {
    await db.update(members)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(members.userId, userId));
    
    return this.findByUserId(userId);
  }

  async addContributionPoints(userId: string, points: number) {
    const member = await this.findByUserId(userId);
    
    if (!member) {
      return null;
    }

    await db.update(members)
      .set({
        contributionPoints: member.contributionPoints + points,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(members.userId, userId));
    
    return this.findByUserId(userId);
  }

  async getStats() {
    const totalMembers = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(members)
      .where(eq(members.status, 'active'));

    const activeMembers = totalMembers[0]?.count ?? 0;

    return {
      totalMembers: activeMembers,
      activeMembers,
    };
  }
}

export const membersRepository = new MembersRepository();
