import { db } from '@core/database';
import { forumPosts, users, forumVotes } from '@core/database/schema';
import { eq, sql, isNull, and, desc } from 'drizzle-orm';
import { generateId } from '@shared/utils';
import type { CreatePostInput, PostFilters, ForumPostWithMetadata } from '../types';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export class ForumRepository {
  /**
   * Optimized query that fetches posts with all metadata in a single query
   * Eliminates N+1 problem by using SQL subqueries
   */
  async findAllWithMetadata(userId: string, filters?: PostFilters): Promise<ForumPostWithMetadata[]> {
    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(forumPosts.category, filters.category));
    }

    // Handle parentId filter
    if (filters?.parentId === null || filters?.rootOnly) {
      conditions.push(isNull(forumPosts.parentId));
    } else if (filters?.parentId) {
      conditions.push(eq(forumPosts.parentId, filters.parentId));
    }

    // Handle projectId filter
    if (filters?.projectId === null) {
      conditions.push(isNull(forumPosts.projectId));
    } else if (filters?.projectId) {
      conditions.push(eq(forumPosts.projectId, filters.projectId));
    }

    if (filters?.authorId) {
      conditions.push(eq(forumPosts.authorId, filters.authorId));
    }

    const limit = Math.min(filters?.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = filters?.offset || 0;

    const query = db
      .select({
        id: forumPosts.id,
        title: forumPosts.title,
        content: forumPosts.content,
        category: forumPosts.category,
        authorId: forumPosts.authorId,
        parentId: forumPosts.parentId,
        projectId: forumPosts.projectId,
        rootPostId: forumPosts.rootPostId,
        threadDepth: forumPosts.threadDepth,
        isPinned: forumPosts.isPinned,
        isLocked: forumPosts.isLocked,
        lastActivityAt: forumPosts.lastActivityAt,
        authorName: users.username,
        authorPrivyDid: users.privyDid,
        createdAt: forumPosts.createdAt,
        updatedAt: forumPosts.updatedAt,
        // Aggregate vote count in single query
        upvotes: sql<number>`COALESCE(
          (SELECT SUM(vote_type) FROM forum_votes WHERE post_id = ${forumPosts.id}),
          0
        )`,
        // Check if current user has upvoted
        hasUpvoted: sql<number>`COALESCE(
          (SELECT vote_type FROM forum_votes
           WHERE post_id = ${forumPosts.id} AND user_id = ${userId}),
          0
        )`,
        // Count replies (only for top-level posts)
        replyCount: sql<number>`COALESCE(
          (SELECT COUNT(*) FROM forum_posts AS replies
           WHERE replies.parent_id = ${forumPosts.id}),
          0
        )`,
      })
      .from(forumPosts)
      .leftJoin(users, eq(forumPosts.authorId, users.id))
      .$dynamic();

    if (conditions.length > 0) {
      return query
        .where(and(...conditions))
        .orderBy(desc(forumPosts.isPinned), desc(forumPosts.lastActivityAt))
        .limit(limit)
        .offset(offset);
    }

    return query
      .orderBy(desc(forumPosts.isPinned), desc(forumPosts.lastActivityAt))
      .limit(limit)
      .offset(offset);
  }

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

    // Apply pagination with sensible defaults to prevent unbounded queries
    const limit = Math.min(filters?.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = filters?.offset || 0;

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
      return query
        .where(and(...conditions))
        .orderBy(desc(forumPosts.createdAt))
        .limit(limit)
        .offset(offset);
    }

    return query
      .orderBy(desc(forumPosts.createdAt))
      .limit(limit)
      .offset(offset);
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
    const now = new Date().toISOString();

    // Calculate threading fields
    let rootPostId: string | null = null;
    let threadDepth = 0;

    if (data.parentId) {
      // This is a reply - get parent post to determine depth and root
      const parentPost = await this.findById(data.parentId);
      if (parentPost) {
        threadDepth = (parentPost.threadDepth ?? 0) + 1;
        // Root is either the parent's root or the parent itself if it's a top-level post
        rootPostId = parentPost.rootPostId ?? parentPost.id;

        // Update parent's lastActivityAt
        await db.update(forumPosts)
          .set({ lastActivityAt: now })
          .where(eq(forumPosts.id, data.parentId));

        // Also update the root post's lastActivityAt if different from parent
        if (rootPostId && rootPostId !== data.parentId) {
          await db.update(forumPosts)
            .set({ lastActivityAt: now })
            .where(eq(forumPosts.id, rootPostId));
        }
      }
    }

    await db.insert(forumPosts).values({
      id,
      authorId,
      title: data.title,
      content: data.content,
      category: data.category,
      parentId: data.parentId,
      projectId: data.projectId,
      rootPostId,
      threadDepth,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
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

  /**
   * Vote on a post with toggle behavior:
   * - If no existing vote: create vote
   * - If same vote type: remove vote (toggle off)
   * - If different vote type: update vote
   *
   * Uses INSERT OR REPLACE for atomic upsert to prevent race conditions
   */
  async vote(postId: string, userId: string, voteType: 1 | -1) {
    // First check existing vote to determine action
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
        // Same vote type - toggle off (delete)
        await db.delete(forumVotes)
          .where(
            and(
              eq(forumVotes.postId, postId),
              eq(forumVotes.userId, userId)
            )
          );
        return { action: 'removed', voteType: 0 };
      } else {
        // Different vote type - update using atomic operation
        await db.update(forumVotes)
          .set({ voteType })
          .where(
            and(
              eq(forumVotes.postId, postId),
              eq(forumVotes.userId, userId)
            )
          );
        return { action: 'updated', voteType };
      }
    } else {
      // No existing vote - use INSERT with ON CONFLICT to handle race condition
      // If another request inserts between our check and insert, this will update instead
      await db.insert(forumVotes)
        .values({
          postId,
          userId,
          voteType,
          createdAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: [forumVotes.postId, forumVotes.userId],
          set: { voteType },
        });
      return { action: 'created', voteType };
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

  /**
   * Get all posts in a thread (root post + all nested replies)
   * Returns flat list ordered for tree construction
   */
  async getThreadPosts(rootPostId: string, userId: string): Promise<ForumPostWithMetadata[]> {
    return db
      .select({
        id: forumPosts.id,
        title: forumPosts.title,
        content: forumPosts.content,
        category: forumPosts.category,
        authorId: forumPosts.authorId,
        parentId: forumPosts.parentId,
        projectId: forumPosts.projectId,
        rootPostId: forumPosts.rootPostId,
        threadDepth: forumPosts.threadDepth,
        isPinned: forumPosts.isPinned,
        isLocked: forumPosts.isLocked,
        lastActivityAt: forumPosts.lastActivityAt,
        authorName: users.username,
        authorPrivyDid: users.privyDid,
        createdAt: forumPosts.createdAt,
        updatedAt: forumPosts.updatedAt,
        upvotes: sql<number>`COALESCE(
          (SELECT SUM(vote_type) FROM forum_votes WHERE post_id = ${forumPosts.id}),
          0
        )`,
        hasUpvoted: sql<number>`COALESCE(
          (SELECT vote_type FROM forum_votes
           WHERE post_id = ${forumPosts.id} AND user_id = ${userId}),
          0
        )`,
        replyCount: sql<number>`COALESCE(
          (SELECT COUNT(*) FROM forum_posts AS replies
           WHERE replies.parent_id = ${forumPosts.id}),
          0
        )`,
      })
      .from(forumPosts)
      .leftJoin(users, eq(forumPosts.authorId, users.id))
      .where(
        sql`${forumPosts.id} = ${rootPostId} OR ${forumPosts.rootPostId} = ${rootPostId}`
      )
      .orderBy(forumPosts.threadDepth, forumPosts.createdAt);
  }

  /**
   * Check if a thread is locked (prevents new replies)
   */
  async isThreadLocked(postId: string): Promise<boolean> {
    const post = await this.findById(postId);
    if (!post) return false;

    // Check the post itself or its root post
    const rootId = post.rootPostId ?? post.id;
    const rootPost = post.rootPostId ? await this.findById(rootId) : post;

    return rootPost?.isLocked === 1;
  }

  /**
   * Lock or unlock a thread (only the root post)
   */
  async setThreadLocked(postId: string, locked: boolean) {
    await db.update(forumPosts)
      .set({ isLocked: locked ? 1 : 0, updatedAt: new Date().toISOString() })
      .where(eq(forumPosts.id, postId));
  }

  /**
   * Pin or unpin a post
   */
  async setPostPinned(postId: string, pinned: boolean) {
    await db.update(forumPosts)
      .set({ isPinned: pinned ? 1 : 0, updatedAt: new Date().toISOString() })
      .where(eq(forumPosts.id, postId));
  }
}

export const forumRepository = new ForumRepository();
