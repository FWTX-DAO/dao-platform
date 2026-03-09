import { db } from '@core/database';
import { members } from '@core/database/schema';
import { eq, sql } from 'drizzle-orm';
import { StampsRepository } from './stamps.repository';
import { ValidationError } from '@core/errors';
import type { IssueStampsInput, IssueStampsResult } from '../types';

export class StampsService {
  constructor(private repository: StampsRepository) {}

  async getStampsForMember(memberId: string) {
    return this.repository.findByMember(memberId);
  }

  async issueStamp(data: {
    memberId: string;
    eventName: string;
    eventDate: Date | null;
    eventType: string;
    description?: string;
    issuedBy: string;
    pointsAwarded: number;
  }) {
    const stamp = await this.repository.create(data);

    // Award contribution points
    if (data.pointsAwarded > 0) {
      await db
        .update(members)
        .set({
          contributionPoints: sql`${members.contributionPoints} + ${data.pointsAwarded}`,
          updatedAt: new Date(),
        })
        .where(eq(members.id, data.memberId));
    }

    return stamp;
  }

  async issueStampsByEmail(
    input: IssueStampsInput,
    issuedByUserId: string,
  ): Promise<IssueStampsResult> {
    const normalizedEmails = input.emails.map((e) => e.toLowerCase().trim());

    if (normalizedEmails.length === 0) {
      throw new ValidationError('At least one email is required');
    }

    // Look up members by email
    const matchedMembers = await this.repository.findMembersByEmails(normalizedEmails);
    const matchedEmailSet = new Set(
      matchedMembers.map((m) => m.email?.toLowerCase()),
    );

    const notFound = normalizedEmails.filter((e) => !matchedEmailSet.has(e));

    // Issue stamps for matched members
    let issued = 0;
    const eventDate = input.eventDate ? new Date(input.eventDate) : null;

    for (const member of matchedMembers) {
      await this.issueStamp({
        memberId: member.id,
        eventName: input.eventName,
        eventDate,
        eventType: input.eventType,
        description: input.description,
        issuedBy: issuedByUserId,
        pointsAwarded: input.pointsAwarded ?? 5,
      });
      issued++;
    }

    return { issued, notFound };
  }
}

export const stampsService = new StampsService(new StampsRepository());
