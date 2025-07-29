import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, generateId } from "../../../lib/api-helpers";
import { getOrCreateUser } from "../../../src/db/queries/users";
import { db, forumPosts, users, forumVotes } from "../../../src/db";
import { eq, sql, isNull, and } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const claims = await authenticateRequest(req);
    const privyDid = claims.userId;
    const email = claims.email || undefined;

    // Get or create user
    const user = await getOrCreateUser(privyDid, email);

    if (req.method === "GET") {
      // Get all forum posts with vote counts and user vote status
      const posts = await db
        .select({
          id: forumPosts.id,
          title: forumPosts.title,
          content: forumPosts.content,
          category: forumPosts.category,
          author_id: forumPosts.authorId,
          author_name: users.username,
          author_avatar: users.avatarUrl,
          created_at: forumPosts.createdAt,
          updated_at: forumPosts.updatedAt,
          // Aggregate vote count
          upvotes: sql<number>`COALESCE(
            (SELECT SUM(vote_type) FROM forum_votes WHERE post_id = ${forumPosts.id}), 
            0
          )`,
          // Check if current user has upvoted
          has_upvoted: sql<number>`COALESCE(
            (SELECT vote_type FROM forum_votes 
             WHERE post_id = ${forumPosts.id} AND user_id = ${user.id}), 
            0
          )`,
          // Count replies
          reply_count: sql<number>`COALESCE(
            (SELECT COUNT(*) FROM forum_posts AS replies 
             WHERE replies.parent_id = ${forumPosts.id}), 
            0
          )`,
        })
        .from(forumPosts)
        .leftJoin(users, eq(forumPosts.authorId, users.id))
        .where(isNull(forumPosts.parentId))
        .orderBy(sql`${forumPosts.createdAt} DESC`);

      return res.status(200).json(posts);
    } 
    
    else if (req.method === "POST") {
      // Create new forum post
      const { title, content, category, parent_id } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      const postId = generateId();
      const newPost = await db.insert(forumPosts).values({
        id: postId,
        authorId: user.id,
        title,
        content,
        category: category || "General",
        parentId: parent_id || null,
      }).returning();

      // Return the created post with author info
      const postWithAuthor = {
        ...newPost[0],
        author_name: user.username,
        author_avatar: user.avatarUrl,
        upvotes: 0,
        reply_count: 0,
        has_upvoted: 0,
      };

      return res.status(201).json(postWithAuthor);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Forum posts API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}