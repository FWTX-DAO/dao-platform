import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "@utils/api-helpers";
import { getOrCreateUser } from "@core/database/queries/users";
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const claims = await authenticateRequest(req);
    const privyDid = claims.userId;
    const email = (claims as any).email || undefined;

    // Get or create user
    const user = await getOrCreateUser(privyDid, email);

    const { id: postId } = req.query;

    if (!postId || typeof postId !== 'string') {
      return res.status(400).json({ error: "Valid post ID is required" });
    }

    // Get full thread with nested replies
    const thread = await forumService.getThread(postId, user!.id);

    // Transform to snake_case for API compatibility
    return res.status(200).json(transformPost(thread));
  } catch (error: any) {
    console.error("Forum thread API error:", error);

    if (error.name === 'NotFoundError') {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
