import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, generateId } from "@utils/api-helpers";
import { sanitizeForumPostInput } from "@utils/utils";
import { getOrCreateUser } from "@core/database/queries/users";
import { db, forumPosts, users } from "@core/database";
import { eq, sql, isNull } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const claims = await authenticateRequest(req);
    const privyDid = claims.userId;
    const email = (claims as any).email || undefined;

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
             WHERE post_id = ${forumPosts.id} AND user_id = ${user!.id}), 
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
      const rawInput = req.body;

      if (!rawInput.title || !rawInput.content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      // Sanitize all input data
      const sanitizedInput = sanitizeForumPostInput({
        title: rawInput.title,
        content: rawInput.content,
        category: rawInput.category,
        parent_id: rawInput.parent_id,
      });

      // Additional validation after sanitization
      if (!sanitizedInput.title || !sanitizedInput.content) {
        return res.status(400).json({
          error: "Title and content cannot be empty after sanitization"
        });
      }

      const postId = generateId();
      const newPost = await db.insert(forumPosts).values({
        id: postId,
        authorId: user!.id,
        title: sanitizedInput.title,
        content: sanitizedInput.content,
        category: sanitizedInput.category,
        parentId: sanitizedInput.parent_id,
      }).returning();

      // Return the created post with author info
      const postWithAuthor = {
        ...newPost[0],
        author_name: user!.username,
        author_avatar: user!.avatarUrl,
        upvotes: 0,
        reply_count: 0,
        has_upvoted: 0,
      };

      return res.status(201).json(postWithAuthor);
    }
    
    else if (req.method === "PUT") {
      // Update existing forum post
      const { id, title, content, category } = req.body;

      if (!id || !title || !content) {
        return res.status(400).json({ error: "ID, title and content are required" });
      }

      // Check if post exists and user is the author
      const existingPost = await db
        .select()
        .from(forumPosts)
        .where(eq(forumPosts.id, id))
        .limit(1);

      if (existingPost.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (existingPost[0]!.authorId !== user!.id) {
        return res.status(403).json({ error: "You can only edit your own posts" });
      }

      // Sanitize input data
      const sanitizedInput = sanitizeForumPostInput({
        title: title,
        content: content,
        category: category,
      });

      // Additional validation after sanitization
      if (!sanitizedInput.title || !sanitizedInput.content) {
        return res.status(400).json({
          error: "Title and content cannot be empty after sanitization"
        });
      }

      await db
        .update(forumPosts)
        .set({
          title: sanitizedInput.title,
          content: sanitizedInput.content,
          category: sanitizedInput.category,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(forumPosts.id, id));

      // Get updated post with vote counts
      const postWithData = await db
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
          upvotes: sql<number>`COALESCE(
            (SELECT SUM(vote_type) FROM forum_votes WHERE post_id = ${forumPosts.id}), 
            0
          )`,
          has_upvoted: sql<number>`COALESCE(
            (SELECT vote_type FROM forum_votes 
             WHERE post_id = ${forumPosts.id} AND user_id = ${user!.id}), 
            0
          )`,
          reply_count: sql<number>`COALESCE(
            (SELECT COUNT(*) FROM forum_posts AS replies 
             WHERE replies.parent_id = ${forumPosts.id}), 
            0
          )`,
        })
        .from(forumPosts)
        .leftJoin(users, eq(forumPosts.authorId, users.id))
        .where(eq(forumPosts.id, id))
        .limit(1);

      return res.status(200).json(postWithData[0]);
    }
    
    else if (req.method === "DELETE") {
      // Delete forum post
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Post ID is required" });
      }

      // Check if post exists and user is the author
      const existingPost = await db
        .select()
        .from(forumPosts)
        .where(eq(forumPosts.id, id))
        .limit(1);

      if (existingPost.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (existingPost[0]!.authorId !== user!.id) {
        return res.status(403).json({ error: "You can only delete your own posts" });
      }

      // Delete the post (this will cascade to replies and votes due to foreign keys)
      await db.delete(forumPosts).where(eq(forumPosts.id, id));

      return res.status(200).json({ message: "Post deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Forum posts API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}