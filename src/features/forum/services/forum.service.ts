import { ForumRepository } from './forum.repository';
import { NotFoundError } from '@core/errors';
import type { CreatePostInput, PostFilters, ForumPostWithMetadata } from '../types';

export class ForumService {
  constructor(private repository: ForumRepository) {}

  async getPostsWithMetadata(userId: string, filters?: PostFilters): Promise<ForumPostWithMetadata[]> {
    const posts = await this.repository.findAll(filters);
    
    return Promise.all(
      posts.map(async (post) => ({
        ...post,
        upvotes: await this.repository.getVoteCount(post.id),
        hasUpvoted: await this.repository.getUserVote(post.id, userId),
        replyCount: post.parentId === null ? await this.repository.getReplyCount(post.id) : 0,
      }))
    );
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
