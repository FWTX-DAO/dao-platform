import { db } from '@core/database';
import { members, users, membershipTiers, memberRoles, roles } from '@core/database/schema';
import { eq, and, desc, sql, like, or } from 'drizzle-orm';
import { generateId } from '@shared/utils';
import type { UpdateMembershipInput, UpdateProfileInput, MemberProfileFilters } from '../types';

const PROFILE_FIELDS = [
  'firstName', 'lastName', 'email', 'phone',
  'employer', 'jobTitle', 'industry',
  'civicInterests', 'skills',
  'city', 'state', 'zip',
  'linkedinUrl',
] as const;

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
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.findByUserId(userId);
  }

  async update(userId: string, data: UpdateMembershipInput) {
    await db.update(members)
      .set({ ...data, updatedAt: new Date() })
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
        updatedAt: new Date(),
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

  // --- Profile methods ---

  async updateProfile(userId: string, profileData: UpdateProfileInput) {
    const member = await this.findByUserId(userId);
    if (!member) return null;

    const completeness = this.calculateProfileCompleteness({ ...member, ...profileData });

    await db
      .update(members)
      .set({
        ...profileData,
        profileCompleteness: completeness,
        updatedAt: new Date(),
      })
      .where(eq(members.userId, userId));

    return this.findByUserId(userId);
  }

  calculateProfileCompleteness(member: Record<string, unknown>): number {
    let filled = 0;
    for (const field of PROFILE_FIELDS) {
      const val = member[field];
      if (val !== null && val !== undefined && val !== '') {
        filled++;
      }
    }
    return Math.round((filled / PROFILE_FIELDS.length) * 100);
  }

  async completeOnboarding(userId: string, data: UpdateProfileInput & { termsAccepted?: boolean }) {
    const member = await this.findByUserId(userId);
    if (!member) return null;

    const { termsAccepted, ...profileData } = data as any;
    const completeness = this.calculateProfileCompleteness({ ...member, ...profileData });

    await db
      .update(members)
      .set({
        ...profileData,
        profileCompleteness: completeness,
        onboardingStatus: 'completed',
        termsAcceptedAt: termsAccepted ? new Date() : member.termsAcceptedAt,
        updatedAt: new Date(),
      })
      .where(eq(members.userId, userId));

    return this.findByUserId(userId);
  }

  async findWithProfile(userId: string) {
    const results = await db
      .select({
        member: members,
        username: users.username,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        tierName: membershipTiers.name,
        tierDisplayName: membershipTiers.displayName,
      })
      .from(members)
      .leftJoin(users, eq(members.userId, users.id))
      .leftJoin(membershipTiers, eq(members.currentTierId, membershipTiers.id))
      .where(eq(members.userId, userId))
      .limit(1);

    if (!results[0]) return null;

    const { member, ...extras } = results[0];

    // Get role names
    const memberRolesList = await db
      .select({ roleName: roles.name })
      .from(memberRoles)
      .innerJoin(roles, eq(memberRoles.roleId, roles.id))
      .where(and(eq(memberRoles.memberId, member.id), eq(memberRoles.isActive, true)));

    return {
      ...member,
      ...extras,
      roleNames: memberRolesList.map((r) => r.roleName),
    };
  }

  async findByFilters(filters: MemberProfileFilters) {
    const conditions = [eq(members.status, 'active')];

    if (filters.city) {
      conditions.push(eq(members.city, filters.city));
    }
    if (filters.industry) {
      conditions.push(eq(members.industry, filters.industry));
    }
    if (filters.availability) {
      conditions.push(eq(members.availability, filters.availability));
    }
    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        or(
          like(members.firstName, term),
          like(members.lastName, term),
          like(members.skills, term),
          like(members.industry, term),
        )!,
      );
    }

    return db
      .select({
        id: members.id,
        userId: members.userId,
        firstName: members.firstName,
        lastName: members.lastName,
        city: members.city,
        industry: members.industry,
        jobTitle: members.jobTitle,
        availability: members.availability,
        contributionPoints: members.contributionPoints,
        joinedAt: members.joinedAt,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(members)
      .leftJoin(users, eq(members.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(members.contributionPoints))
      .limit(filters.limit ?? 50)
      .offset(filters.offset ?? 0);
  }

  async findByStripeCustomerId(stripeCustomerId: string) {
    const results = await db
      .select()
      .from(members)
      .where(eq(members.stripeCustomerId, stripeCustomerId))
      .limit(1);
    return results[0] ?? null;
  }

  async updateCurrentTier(userId: string, tierId: string) {
    await db
      .update(members)
      .set({ currentTierId: tierId, updatedAt: new Date() })
      .where(eq(members.userId, userId));
  }
}

export const membersRepository = new MembersRepository();
