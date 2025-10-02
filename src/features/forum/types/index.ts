import { z } from 'zod';
import { VALIDATION_LIMITS, FORUM_CATEGORIES } from '@shared/constants';
import type { ForumPost as ForumPostDB, InsertForumPost } from '@shared/types';

export type ForumPost = ForumPostDB;
export type CreateForumPost = InsertForumPost;

export interface ForumPostWithMetadata extends ForumPost {
  authorName?: string | null;
  upvotes: number;
  hasUpvoted: number;
  replyCount?: number;
}

export const CreatePostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(VALIDATION_LIMITS.TITLE_MAX_LENGTH, 'Title is too long'),
  content: z.string()
    .min(1, 'Content is required')
    .max(VALIDATION_LIMITS.CONTENT_MAX_LENGTH, 'Content is too long'),
  category: z.enum(FORUM_CATEGORIES as unknown as [string, ...string[]]).optional().default('General'),
  parentId: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export interface PostFilters {
  category?: string;
  authorId?: string;
  parentId?: string | null;
}
