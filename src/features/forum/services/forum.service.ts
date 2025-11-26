import { ForumRepository } from './forum.repository';
import { NotFoundError, ValidationError } from '@core/errors';
import type { CreatePostInput, PostFilters, ForumPostWithMetadata, ForumPostWithReplies } from '../types';

export class ForumService {
  constructor(private repository: ForumRepository) {}

  /**
   * Get posts with metadata using optimized single-query approach
   * Eliminates N+1 problem by using SQL subqueries instead of separate queries per post
   */
  async getPostsWithMetadata(userId: string, filters?: PostFilters): Promise<ForumPostWithMetadata[]> {
    return this.repository.findAllWithMetadata(userId, filters);
  }

  /**
   * Get posts for a specific project
   */
  async getProjectPosts(projectId: string, userId: string, filters?: PostFilters): Promise<ForumPostWithMetadata[]> {
    return this.repository.findAllWithMetadata(userId, { ...filters, projectId, rootOnly: true });
  }

  async getPostById(id: string, userId: string): Promise<ForumPostWithMetadata> {
    const post = await this.repository.findById(id);

    if (!post) {
      throw new NotFoundError('Post');
    }

    return {
      ...post,
      upvotes: await this.repository.getVoteCount(id),
      hasUpvoted: await this.repository.getUserVote(id, userId),
      replyCount: await this.repository.getReplyCount(id),
    };
  }

  /**
   * Get a full thread with nested replies as a tree structure
   */
  async getThread(postId: string, userId: string): Promise<ForumPostWithReplies> {
    const post = await this.repository.findById(postId);

    if (!post) {
      throw new NotFoundError('Post');
    }

    // Get the root post ID (either this post is root, or get its root)
    const rootPostId = post.rootPostId ?? post.id;

    // Get all posts in the thread
    const allPosts = await this.repository.getThreadPosts(rootPostId, userId);

    // Build tree structure
    return this.buildThreadTree(allPosts, rootPostId);
  }

  /**
   * Build a nested tree structure from flat posts list
   */
  private buildThreadTree(posts: ForumPostWithMetadata[], rootId: string): ForumPostWithReplies {
    const postMap = new Map<string, ForumPostWithReplies>();

    // First pass: create map of all posts
    for (const post of posts) {
      postMap.set(post.id, { ...post, replies: [] });
    }

    // Second pass: build tree by assigning children to parents
    let root: ForumPostWithReplies | undefined;

    for (const post of posts) {
      const node = postMap.get(post.id)!;

      if (post.id === rootId) {
        root = node;
      } else if (post.parentId) {
        const parent = postMap.get(post.parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(node);
        }
      }
    }

    if (!root) {
      throw new NotFoundError('Thread root post');
    }

    return root;
  }

  async createPost(data: CreatePostInput, userId: string) {
    // Check if replying to a locked thread
    if (data.parentId) {
      const isLocked = await this.repository.isThreadLocked(data.parentId);
      if (isLocked) {
        throw new ValidationError('Cannot reply to a locked thread');
      }
    }

    return this.repository.create(data, userId);
  }

  async updatePost(id: string, data: Partial<CreatePostInput>, userId: string) {
    const post = await this.repository.findById(id);

    if (!post) {
      throw new NotFoundError('Post');
    }

    if (post.authorId !== userId) {
      throw new ValidationError('Unauthorized');
    }

    return this.repository.update(id, data);
  }

  async deletePost(id: string, userId: string) {
    const post = await this.repository.findById(id);

    if (!post) {
      throw new NotFoundError('Post');
    }

    if (post.authorId !== userId) {
      throw new ValidationError('Unauthorized');
    }

    await this.repository.delete(id);
  }

  async voteOnPost(postId: string, userId: string, voteType: 1 | -1) {
    const post = await this.repository.findById(postId);

    if (!post) {
      throw new NotFoundError('Post');
    }

    await this.repository.vote(postId, userId, voteType);
  }

  async getReplies(postId: string, userId: string): Promise<ForumPostWithMetadata[]> {
    return this.getPostsWithMetadata(userId, { parentId: postId });
  }

  /**
   * Lock or unlock a thread (admin/author only)
   */
  async setThreadLocked(postId: string, userId: string, locked: boolean) {
    const post = await this.repository.findById(postId);

    if (!post) {
      throw new NotFoundError('Post');
    }

    // Only allow locking root posts
    if (post.parentId) {
      throw new ValidationError('Can only lock root posts');
    }

    // Only the author can lock/unlock (could add admin check here)
    if (post.authorId !== userId) {
      throw new ValidationError('Unauthorized');
    }

    await this.repository.setThreadLocked(postId, locked);
  }

  /**
   * Pin or unpin a post (admin/author only)
   */
  async setPostPinned(postId: string, userId: string, pinned: boolean) {
    const post = await this.repository.findById(postId);

    if (!post) {
      throw new NotFoundError('Post');
    }

    // Only the author can pin/unpin (could add admin check here)
    if (post.authorId !== userId) {
      throw new ValidationError('Unauthorized');
    }

    await this.repository.setPostPinned(postId, pinned);
  }
}

export const forumService = new ForumService(new ForumRepository());
