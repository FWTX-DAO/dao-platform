import { db } from '@core/database';
import { forumPosts, users, forumVotes } from '@core/database/schema';
import { eq, sql, isNull, and, desc } from 'drizzle-orm';
import { generateId } from '@shared/utils';
import type { CreatePostInput, PostFilters } from '../types';

export class ForumRepository {
  async findAll(filters?: PostFilters) {
    const conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(forumPosts.category, filters.category));
    }

    if (filters?.parentId === null) {
      conditions.push(isNull(forumPosts.parentId));
    } else if (filters?.parentId) {
      conditions.push(eq(forumPosts.parentId, filters.parentId));
    }

    if (filters?.authorId) {
      conditions.push(eq(forumPosts.authorId, filters.authorId));
    }

    const query = db
      .select({
        id: forumPosts.id,
        title: forumPosts.title,
        content: forumPosts.content,
        category: forumPosts.category,
        authorId: forumPosts.authorId,
        parentId: forumPosts.parentId,
        authorName: users.username,
        createdAt: forumPosts.createdAt,
        updatedAt: forumPosts.updatedAt,
      })
      .from(forumPosts)
      .leftJoin(users, eq(forumPosts.authorId, users.id))
      .$dynamic();

    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(forumPosts.createdAt));
    }
    
    return query.orderBy(desc(forumPosts.createdAt));
  }

  async findById(id: string) {
    const results = await db
      .select()
      .from(forumPosts)
      .where(eq(forumPosts.id, id))
      .limit(1);
    
    return results[0] ?? null;
  }

  async create(data: CreatePostInput, authorId: string) {
    const id = generateId();
    await db.insert(forumPosts).values({
      id,
      authorId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return this.findById(id);
  }

  async update(id: string, data: Partial<CreatePostInput>) {
    await db.update(forumPosts)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(forumPosts.id, id));
    
    return this.findById(id);
  }

  async delete(id: string) {
    await db.delete(forumPosts).where(eq(forumPosts.id, id));
  }

  async getVoteCount(postId: string) {
    const result = await db
      .select({
        count: sql<number>`COALESCE(SUM(vote_type), 0)`,
      })
      .from(forumVotes)
      .where(eq(forumVotes.postId, postId));
    
    return result[0]?.count ?? 0;
  }

  async getUserVote(postId: string, userId: string) {
    const result = await db
      .select()
      .from(forumVotes)
      .where(
        and(
          eq(forumVotes.postId, postId),
          eq(forumVotes.userId, userId)
        )
      )
      .limit(1);
    
    return result[0]?.voteType ?? 0;
  }

  async vote(postId: string, userId: string, voteType: 1 | -1) {
    const existingVote = await db
      .select()
      .from(forumVotes)
      .where(
        and(
          eq(forumVotes.postId, postId),
          eq(forumVotes.userId, userId)
        )
      )
      .limit(1);

    if (existingVote.length > 0 && existingVote[0]) {
      if (existingVote[0].voteType === voteType) {
        await db.delete(forumVotes)
          .where(
            and(
              eq(forumVotes.postId, postId),
              eq(forumVotes.userId, userId)
            )
          );
      } else {
        await db.update(forumVotes)
          .set({ voteType })
          .where(
            and(
              eq(forumVotes.postId, postId),
              eq(forumVotes.userId, userId)
            )
          );
      }
    } else {
      await db.insert(forumVotes).values({
        postId,
        userId,
        voteType,
        createdAt: new Date().toISOString(),
      });
    }
  }

  async getReplyCount(postId: string) {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(forumPosts)
      .where(eq(forumPosts.parentId, postId));
    
    return result[0]?.count ?? 0;
  }
}

export const forumRepository = new ForumRepository();
