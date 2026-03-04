import type { NextApiResponse } from "next";
import {
  compose,
  errorHandler,
  withAuth,
  type AuthenticatedRequest,
} from "@core/middleware";
import { ValidationError } from "@core/errors/AppError";
import { forumService } from "@features/forum";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = req.user;
  const { id: postId } = req.query;

  if (!postId || typeof postId !== "string") {
    throw new ValidationError("Valid post ID is required");
  }

  // Get all replies for the post
  const replies = await forumService.getReplies(postId, user.id);

  // Transform to snake_case for API compatibility
  const transformedReplies = replies.map((reply) => ({
    id: reply.id,
    title: reply.title,
    content: reply.content,
    category: reply.category,
    author_id: reply.authorId,
    author_name: reply.authorName,
    author_privy_did: reply.authorPrivyDid,
    parent_id: reply.parentId,
    project_id: reply.projectId,
    thread_depth: reply.threadDepth,
    is_pinned: reply.isPinned,
    is_locked: reply.isLocked,
    created_at: reply.createdAt,
    updated_at: reply.updatedAt,
    upvotes: reply.upvotes,
    has_upvoted: reply.hasUpvoted,
    reply_count: reply.replyCount,
  }));

  return res.status(200).json(transformedReplies);
}

export default compose(errorHandler, withAuth)(handler);
