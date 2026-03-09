import { db } from '@core/database';
import { passportStamps, members } from '@core/database/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { generateId } from '@shared/utils';

export class StampsRepository {
  async create(data: {
    memberId: string;
    eventName: string;
    eventDate: Date | null;
    eventType: string;
    description?: string;
    issuedBy: string;
    pointsAwarded: number;
    metadata?: unknown;
  }) {
    const id = generateId();

    await db.insert(passportStamps).values({
      id,
      memberId: data.memberId,
      eventName: data.eventName,
      eventDate: data.eventDate,
      eventType: data.eventType,
      description: data.description ?? null,
      issuedBy: data.issuedBy,
      pointsAwarded: data.pointsAwarded,
      metadata: data.metadata ?? null,
    });

    return { id, ...data, createdAt: new Date() };
  }

  async findByMember(memberId: string, limit = 50) {
    return db
      .select()
      .from(passportStamps)
      .where(eq(passportStamps.memberId, memberId))
      .orderBy(desc(passportStamps.createdAt))
      .limit(limit);
  }

  async findMembersByEmails(emails: string[]) {
    if (emails.length === 0) return [];

    return db
      .select({
        id: members.id,
        email: members.email,
      })
      .from(members)
      .where(inArray(members.email, emails));
  }
}

export const stampsRepository = new StampsRepository();
