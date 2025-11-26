import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "@utils/api-helpers";
import { getOrCreateUser } from "@core/database/queries/users";
import { forumService } from "@features/forum";

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

    // Get all replies for the post
    const replies = await forumService.getReplies(postId, user!.id);

    // Transform to snake_case for API compatibility
    const transformedReplies = replies.map(reply => ({
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
  } catch (error: any) {
    console.error("Forum replies API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
