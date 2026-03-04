import type { NextApiResponse } from "next";
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from "@core/middleware";
import { ValidationError } from "@core/errors/AppError";
import { sanitizeForumPostInput } from "@utils/utils";
import { forumService } from "@features/forum";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user;

  if (req.method === "GET") {
    const { limit: limitParam, offset: offsetParam, category, projectId } = req.query;
    const limit = parseInt(limitParam as string) || 20;
    const offset = parseInt(offsetParam as string) || 0;

    const posts = await forumService.getPostsWithMetadata(user.id, {
      limit,
      offset,
      category: category as string | undefined,
      projectId: projectId as string | undefined,
      rootOnly: true,
    });

    const transformedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      author_id: post.authorId,
      author_name: post.authorName,
      author_privy_did: post.authorPrivyDid,
      parent_id: post.parentId,
      project_id: post.projectId,
      thread_depth: post.threadDepth,
      is_pinned: post.isPinned,
      is_locked: post.isLocked,
      last_activity_at: post.lastActivityAt,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      upvotes: post.upvotes,
      has_upvoted: post.hasUpvoted,
      reply_count: post.replyCount,
    }));

    return res.status(200).json(transformedPosts);
  }

  if (req.method === "POST") {
    const rawInput = req.body;

    if (!rawInput.title || !rawInput.content) {
      throw new ValidationError("Title and content are required");
    }

    const sanitizedInput = sanitizeForumPostInput({
      title: rawInput.title,
      content: rawInput.content,
      category: rawInput.category,
      parent_id: rawInput.parent_id,
    });

    if (!sanitizedInput.title || !sanitizedInput.content) {
      throw new ValidationError("Title and content cannot be empty after sanitization");
    }

    const newPost = await forumService.createPost({
      title: sanitizedInput.title,
      content: sanitizedInput.content,
      category: sanitizedInput.category,
      parentId: sanitizedInput.parent_id || undefined,
      projectId: rawInput.project_id || undefined,
    }, user.id);

    return res.status(201).json({
      ...newPost,
      author_name: user.username,
      author_avatar: user.avatarUrl,
      upvotes: 0,
      reply_count: 0,
      has_upvoted: 0,
    });
  }

  if (req.method === "PUT") {
    const { id, title, content, category } = req.body;

    if (!id || !title || !content) {
      throw new ValidationError("ID, title and content are required");
    }

    const sanitizedInput = sanitizeForumPostInput({ title, content, category });

    if (!sanitizedInput.title || !sanitizedInput.content) {
      throw new ValidationError("Title and content cannot be empty after sanitization");
    }

    await forumService.updatePost(id, {
      title: sanitizedInput.title,
      content: sanitizedInput.content,
      category: sanitizedInput.category,
    }, user.id);

    const postWithMetadata = await forumService.getPostById(id, user.id);

    return res.status(200).json({
      ...postWithMetadata,
      author_id: postWithMetadata.authorId,
      author_name: postWithMetadata.authorName,
      created_at: postWithMetadata.createdAt,
      updated_at: postWithMetadata.updatedAt,
      has_upvoted: postWithMetadata.hasUpvoted,
      reply_count: postWithMetadata.replyCount,
    });
  }

  if (req.method === "DELETE") {
    const { id } = req.body;

    if (!id) {
      throw new ValidationError("Post ID is required");
    }

    await forumService.deletePost(id, user.id);
    return res.status(200).json({ message: "Post deleted successfully" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default compose(errorHandler, withAuth)(handler);
