import { ForumRepository } from './forum.repository';
import { NotFoundError } from '@core/errors';
import type { CreatePostInput, PostFilters, ForumPostWithMetadata } from '../types';

export class ForumService {
  constructor(private repository: ForumRepository) {}

  /**
   * Get posts with metadata using optimized single-query approach
   * Eliminates N+1 problem by using SQL subqueries instead of separate queries per post
   */
  async getPostsWithMetadata(userId: string, filters?: PostFilters): Promise<ForumPostWithMetadata[]> {
    // Use optimized query that fetches all data in a single query
    return this.repository.findAllWithMetadata(userId, filters);
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

  async createPost(data: CreatePostInput, userId: string) {
    return this.repository.create(data, userId);
  }

  async updatePost(id: string, data: Partial<CreatePostInput>, userId: string) {
    const post = await this.repository.findById(id);
    
    if (!post) {
      throw new NotFoundError('Post');
    }
    
    if (post.authorId !== userId) {
      throw new Error('Unauthorized');
    }
    
    return this.repository.update(id, data);
  }

  async deletePost(id: string, userId: string) {
    const post = await this.repository.findById(id);
    
    if (!post) {
      throw new NotFoundError('Post');
    }
    
    if (post.authorId !== userId) {
      throw new Error('Unauthorized');
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
}

export const forumService = new ForumService(new ForumRepository());
