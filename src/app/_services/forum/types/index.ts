import { z } from 'zod';
import { VALIDATION_LIMITS, FORUM_CATEGORIES } from '@shared/constants';
import type { ForumPost as ForumPostDB, InsertForumPost } from '@shared/types';

export type ForumPost = ForumPostDB;
export type CreateForumPost = InsertForumPost;

export interface ForumPostWithMetadata extends ForumPost {
  authorName?: string | null;
  authorPrivyDid?: string | null;
  upvotes: number;
  hasUpvoted: number;
  replyCount?: number;
}

// Extended type for nested thread display
export interface ForumPostWithReplies extends ForumPostWithMetadata {
  replies?: ForumPostWithReplies[];
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
  projectId: z.string().optional(), // Associate post with a project
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PostFilters extends PaginationParams {
  category?: string;
  authorId?: string;
  parentId?: string | null;
  projectId?: string | null; // Filter by project
  rootOnly?: boolean; // Only fetch root posts (no replies)
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
