import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "@utils/api-helpers";
import { sanitizeForumPostInput } from "@utils/utils";
import { getOrCreateUser } from "@core/database/queries/users";
import { forumService } from "@features/forum";
import { db, projects } from "@core/database";
import { eq } from "drizzle-orm";

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

    const { id: projectId } = req.query;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: "Valid project ID is required" });
    }

    // Verify project exists
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (req.method === "GET") {
      // Get pagination parameters
      const { limit: limitParam, offset: offsetParam, category } = req.query;
      const limit = parseInt(limitParam as string) || 20;
      const offset = parseInt(offsetParam as string) || 0;

      // Get forum posts for this project
      const posts = await forumService.getProjectPosts(projectId, user!.id, {
        limit,
        offset,
        category: category as string | undefined,
      });

      // Transform to snake_case for API compatibility
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

    else if (req.method === "POST") {
      // Create new forum post for this project
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

      const newPost = await forumService.createPost({
        title: sanitizedInput.title,
        content: sanitizedInput.content,
        category: sanitizedInput.category,
        parentId: sanitizedInput.parent_id || undefined,
        projectId: projectId, // Associate with this project
      }, user!.id);

      // Return the created post with author info
      const postWithAuthor = {
        ...newPost,
        author_name: user!.username,
        author_avatar: user!.avatarUrl,
        upvotes: 0,
        reply_count: 0,
        has_upvoted: 0,
      };

      return res.status(201).json(postWithAuthor);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Project forum API error:", error);

    // Handle specific error types
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ error: error.message });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
