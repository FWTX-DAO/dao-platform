import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, generateId } from "../../../../lib/api-helpers";
import { sanitizeProjectUpdateInput } from "../../../../lib/utils";
import { getOrCreateUser } from "../../../../src/db/queries/users";
import { db, projectUpdates, users, projects, projectCollaborators } from "../../../../src/db";
import { eq, and, or, sql } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const claims = await authenticateRequest(req);
    const privyDid = claims.userId;
    const email = (claims as any).email || undefined;
    const projectId = req.query.id as string;

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    // Get or create user
    const user = await getOrCreateUser(privyDid, email);

    if (req.method === "GET") {
      // Get all updates for the project
      const updates = await db
        .select({
          id: projectUpdates.id,
          title: projectUpdates.title,
          content: projectUpdates.content,
          update_type: projectUpdates.updateType,
          author_id: projectUpdates.authorId,
          author_name: users.username,
          author_avatar: users.avatarUrl,
          created_at: projectUpdates.createdAt,
          updated_at: projectUpdates.updatedAt,
        })
        .from(projectUpdates)
        .leftJoin(users, eq(projectUpdates.authorId, users.id))
        .where(eq(projectUpdates.projectId, projectId))
        .orderBy(sql`${projectUpdates.createdAt} DESC`);

      return res.status(200).json(updates);
    }
    
    else if (req.method === "POST") {
      // Create new project update
      const rawInput = req.body;

      if (!rawInput.title || !rawInput.content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      // Check if user can post updates (must be creator or collaborator)
      const canPost = await db
        .select({ canPost: sql<number>`1` })
        .from(projects)
        .where(
          and(
            eq(projects.id, projectId),
            or(
              eq(projects.creatorId, user!.id),
              sql`EXISTS (
                SELECT 1 FROM project_collaborators 
                WHERE project_id = ${projectId} AND user_id = ${user!.id}
              )`
            )
          )
        )
        .limit(1);

      if (canPost.length === 0) {
        return res.status(403).json({ 
          error: "You must be the creator or a collaborator to post updates" 
        });
      }

      try {
        // Sanitize input data
        const sanitizedInput = sanitizeProjectUpdateInput({
          title: rawInput.title,
          content: rawInput.content,
          updateType: rawInput.updateType,
        });

        // Additional validation after sanitization
        if (!sanitizedInput.title || !sanitizedInput.content) {
          return res.status(400).json({
            error: "Title and content cannot be empty after sanitization"
          });
        }

        const updateId = generateId();

        const newUpdate = await db.insert(projectUpdates).values({
          id: updateId,
          projectId,
          authorId: user!.id,
          title: sanitizedInput.title,
          content: sanitizedInput.content,
          updateType: sanitizedInput.updateType,
        }).returning();

        // Return the created update with author info
        const updateWithAuthor = {
          ...newUpdate[0],
          update_type: newUpdate[0]!.updateType,
          author_name: user!.username,
          author_avatar: user!.avatarUrl,
        };

        return res.status(201).json(updateWithAuthor);
      } catch (error: any) {
        return res.status(400).json({ error: error.message });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Project updates API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}