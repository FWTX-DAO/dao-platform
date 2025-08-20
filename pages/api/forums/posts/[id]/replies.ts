import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "../../../../../lib/api-helpers";
import { getOrCreateUser } from "../../../../../src/db/queries/users";
import { db, forumPosts, users } from "../../../../../src/db";
import { eq, sql } from "drizzle-orm";

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
    const replies = await db
      .select({
        id: forumPosts.id,
        title: forumPosts.title,
        content: forumPosts.content,
        author_id: forumPosts.authorId,
        author_name: users.username,
        author_avatar: users.avatarUrl,
        created_at: forumPosts.createdAt,
        updated_at: forumPosts.updatedAt,
        // Aggregate vote count for each reply
        upvotes: sql<number>`COALESCE(
          (SELECT SUM(vote_type) FROM forum_votes WHERE post_id = ${forumPosts.id}), 
          0
        )`,
        // Check if current user has upvoted this reply
        has_upvoted: sql<number>`COALESCE(
          (SELECT vote_type FROM forum_votes 
           WHERE post_id = ${forumPosts.id} AND user_id = ${user!.id}), 
          0
        )`,
      })
      .from(forumPosts)
      .leftJoin(users, eq(forumPosts.authorId, users.id))
      .where(eq(forumPosts.parentId, postId))
      .orderBy(forumPosts.createdAt);

    return res.status(200).json(replies);
  } catch (error: any) {
    console.error("Forum replies API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}