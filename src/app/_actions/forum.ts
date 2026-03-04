'use server';

import { requireAuth } from '@/app/_lib/auth';
import { forumService } from '@features/forum';
import { db, forumVotes } from '@core/database';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getPosts(filters?: { category?: string; projectId?: string }) {
  const { user } = await requireAuth();
  return forumService.getPostsWithMetadata(user.id, filters);
}

export async function getPostById(postId: string) {
  const { user } = await requireAuth();
  return forumService.getPostById(postId, user.id);
}

export async function getReplies(postId: string) {
  const { user } = await requireAuth();
  return forumService.getReplies(postId, user.id);
}

export async function getThread(postId: string) {
  const { user } = await requireAuth();
  return forumService.getThread(postId, user.id);
}

export async function createPost(data: { title: string; content: string; category?: string; parentId?: string; projectId?: string }) {
  const { user } = await requireAuth();
  const result = await forumService.createPost({ ...data, category: data.category || 'General' }, user.id);
  revalidatePath('/forums');
  return result;
}

export async function updatePost(id: string, data: { title?: string; content?: string; category?: string }) {
  const { user } = await requireAuth();
  const result = await forumService.updatePost(id, data, user.id);
  revalidatePath('/forums');
  return result;
}

export async function deletePost(id: string) {
  const { user } = await requireAuth();
  await forumService.deletePost(id, user.id);
  revalidatePath('/forums');
  return { success: true };
}

export async function vote(postId: string, voteType: number) {
  const { user } = await requireAuth();

  // Check for existing vote
  const existing = await db
    .select()
    .from(forumVotes)
    .where(and(eq(forumVotes.postId, postId), eq(forumVotes.userId, user.id)))
    .limit(1);

  if (voteType === 0) {
    // Remove vote
    if (existing.length > 0) {
      await db
        .delete(forumVotes)
        .where(and(eq(forumVotes.postId, postId), eq(forumVotes.userId, user.id)));
    }
  } else if (existing.length > 0) {
    // Update existing vote
    await db
      .update(forumVotes)
      .set({ voteType })
      .where(and(eq(forumVotes.postId, postId), eq(forumVotes.userId, user.id)));
  } else {
    // Create new vote
    await db.insert(forumVotes).values({
      postId,
      userId: user.id,
      voteType,
    });
  }

  revalidatePath('/forums');
  return { success: true };
}
