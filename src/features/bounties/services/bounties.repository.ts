import { db } from '@core/database';
import { innovationBounties, users } from '@core/database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateId } from '@shared/utils';
import type { CreateBountyInput, BountyFilters } from '../types';

export class BountiesRepository {
  async findAll(filters?: BountyFilters) {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(innovationBounties.status, filters.status));
    }

    if (filters?.category) {
      conditions.push(eq(innovationBounties.category, filters.category));
    }

    if (filters?.submitterId) {
      conditions.push(eq(innovationBounties.submitterId, filters.submitterId));
    }

    const query = db
      .select({
        id: innovationBounties.id,
        organizationName: innovationBounties.organizationName,
        organizationType: innovationBounties.organizationType,
        organizationWebsite: innovationBounties.organizationWebsite,
        title: innovationBounties.title,
        problemStatement: innovationBounties.problemStatement,
        useCase: innovationBounties.useCase,
        desiredOutcome: innovationBounties.desiredOutcome,
        bountyAmount: innovationBounties.bountyAmount,
        bountyType: innovationBounties.bountyType,
        deadline: innovationBounties.deadline,
        category: innovationBounties.category,
        tags: innovationBounties.tags,
        status: innovationBounties.status,
        submitterId: innovationBounties.submitterId,
        submitterName: users.username,
        isAnonymous: innovationBounties.isAnonymous,
        viewCount: innovationBounties.viewCount,
        proposalCount: innovationBounties.proposalCount,
        createdAt: innovationBounties.createdAt,
        updatedAt: innovationBounties.updatedAt,
      })
      .from(innovationBounties)
      .leftJoin(users, eq(innovationBounties.submitterId, users.id))
      .$dynamic();

    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(innovationBounties.createdAt));
    }
    
    return query.orderBy(desc(innovationBounties.createdAt));
  }

  async findById(id: string) {
    const results = await db
      .select()
      .from(innovationBounties)
      .where(eq(innovationBounties.id, id))
      .limit(1);
    
    return results[0] ?? null;
  }

  async create(data: CreateBountyInput, submitterId: string) {
    const id = generateId();
    await db.insert(innovationBounties).values({
      id,
      submitterId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return this.findById(id);
  }

  async update(id: string, data: Partial<CreateBountyInput>) {
    await db.update(innovationBounties)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(innovationBounties.id, id));
    
    return this.findById(id);
  }

  async delete(id: string) {
    await db.delete(innovationBounties).where(eq(innovationBounties.id, id));
  }

  async incrementViewCount(id: string) {
    const bounty = await this.findById(id);
    if (bounty) {
      await db.update(innovationBounties)
        .set({
          viewCount: (bounty.viewCount || 0) + 1,
        })
        .where(eq(innovationBounties.id, id));
    }
  }

  async updateStatus(id: string, status: string, screenedBy?: string, screeningNotes?: string) {
    const updates: any = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (screenedBy) {
      updates.screenedBy = screenedBy;
      updates.screenedAt = new Date().toISOString();
    }

    if (screeningNotes) {
      updates.screeningNotes = screeningNotes;
    }

    if (status === 'published') {
      updates.publishedAt = new Date().toISOString();
    }

    await db.update(innovationBounties)
      .set(updates)
      .where(eq(innovationBounties.id, id));
    
    return this.findById(id);
  }
}

export const bountiesRepository = new BountiesRepository();
