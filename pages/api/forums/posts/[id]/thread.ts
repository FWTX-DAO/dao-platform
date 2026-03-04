import type { NextApiResponse } from "next";
import {
  compose,
  errorHandler,
  withAuth,
  type AuthenticatedRequest,
} from "@core/middleware";
import { ValidationError } from "@core/errors/AppError";
import { forumService } from "@features/forum";
import type { ForumPostWithReplies } from "@features/forum";

// Helper to transform post to snake_case recursively
function transformPost(post: ForumPostWithReplies): any {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    category: post.category,
    author_id: post.authorId,
    author_name: post.authorName,
    author_privy_did: post.authorPrivyDid,
    parent_id: post.parentId,
    project_id: post.projectId,
    root_post_id: post.rootPostId,
    thread_depth: post.threadDepth,
    is_pinned: post.isPinned,
    is_locked: post.isLocked,
    last_activity_at: post.lastActivityAt,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
    upvotes: post.upvotes,
    has_upvoted: post.hasUpvoted,
    reply_count: post.replyCount,
    replies: post.replies?.map(transformPost) || [],
  };
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = req.user;
  const { id: postId } = req.query;

  if (!postId || typeof postId !== "string") {
    throw new ValidationError("Valid post ID is required");
  }

  // Get full thread with nested replies
  const thread = await forumService.getThread(postId, user.id);

  // Transform to snake_case for API compatibility
  return res.status(200).json(transformPost(thread));
}

export default compose(errorHandler, withAuth)(handler);
