import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, generateId } from "../../../lib/api-helpers";
import { sanitizeProjectInput } from "../../../lib/utils";
import { getOrCreateUser } from "../../../src/db/queries/users";
import { db, projects, users } from "../../../src/db";
import { eq, sql } from "drizzle-orm";

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
      // Get all projects with collaborator count
      const projectsList = await db
        .select({
          id: projects.id,
          title: projects.title,
          description: projects.description,
          github_repo: projects.githubRepo,
          intent: projects.intent,
          benefit_to_fort_worth: projects.benefitToFortWorth,
          status: projects.status,
          tags: projects.tags,
          creator_id: projects.creatorId,
          creator_name: users.username,
          creator_avatar: users.avatarUrl,
          created_at: projects.createdAt,
          updated_at: projects.updatedAt,
          // Count collaborators (including creator)
          collaborators: sql<number>`COALESCE(
            (SELECT COUNT(*) + 1 FROM project_collaborators WHERE project_id = ${projects.id}), 
            1
          )`,
        })
        .from(projects)
        .leftJoin(users, eq(projects.creatorId, users.id))
        .orderBy(sql`${projects.createdAt} DESC`);

      return res.status(200).json(projectsList);
    } 
    
    else if (req.method === "POST") {
      // Create new project
      const rawInput = req.body;

      if (!rawInput.title || !rawInput.description || !rawInput.githubRepo || 
          !rawInput.intent || !rawInput.benefitToFortWorth) {
        return res.status(400).json({ 
          error: "Title, description, GitHub repo, intent, and benefit to Fort Worth are required" 
        });
      }

      try {
        // Sanitize all input data
        const sanitizedInput = sanitizeProjectInput({
          title: rawInput.title,
          description: rawInput.description,
          githubRepo: rawInput.githubRepo,
          intent: rawInput.intent,
          benefitToFortWorth: rawInput.benefitToFortWorth,
          tags: rawInput.tags,
        });

        // Additional validation after sanitization
        if (!sanitizedInput.title || !sanitizedInput.description || 
            !sanitizedInput.githubRepo || !sanitizedInput.intent || 
            !sanitizedInput.benefitToFortWorth) {
          return res.status(400).json({
            error: "Required fields cannot be empty after sanitization"
          });
        }

        const projectId = generateId();
        const tagsString = sanitizedInput.tags.join(",");

        const newProject = await db.insert(projects).values({
          id: projectId,
          creatorId: user!.id,
          title: sanitizedInput.title,
          description: sanitizedInput.description,
          githubRepo: sanitizedInput.githubRepo,
          intent: sanitizedInput.intent,
          benefitToFortWorth: sanitizedInput.benefitToFortWorth,
          tags: tagsString,
          status: sanitizedInput.status,
        }).returning();

        // Return the created project with creator info
        const projectWithCreator = {
          ...newProject[0],
          github_repo: newProject[0]!.githubRepo,
          benefit_to_fort_worth: newProject[0]!.benefitToFortWorth,
          creator_name: user!.username,
          creator_avatar: user!.avatarUrl,
          collaborators: 1,
        };

        return res.status(201).json(projectWithCreator);
      } catch (error: any) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    else if (req.method === "PUT") {
      // Update existing project
      const { id, title, description, githubRepo, intent, benefitToFortWorth, tags, status } = req.body;

      if (!id || !title || !description || !githubRepo || !intent || !benefitToFortWorth) {
        return res.status(400).json({ 
          error: "ID and all required fields are needed" 
        });
      }

      // Check if project exists and user is the creator
      const existingProject = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id))
        .limit(1);

      if (existingProject.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (existingProject[0]!.creatorId !== user!.id) {
        return res.status(403).json({ error: "You can only edit your own projects" });
      }

      try {
        // Sanitize input data
        const sanitizedInput = sanitizeProjectInput({
          title,
          description,
          githubRepo,
          intent,
          benefitToFortWorth,
          tags,
          status,
        });

        // Additional validation after sanitization
        if (!sanitizedInput.title || !sanitizedInput.description || 
            !sanitizedInput.githubRepo || !sanitizedInput.intent || 
            !sanitizedInput.benefitToFortWorth) {
          return res.status(400).json({
            error: "Required fields cannot be empty after sanitization"
          });
        }

        const tagsString = sanitizedInput.tags.join(",");

        await db
          .update(projects)
          .set({
            title: sanitizedInput.title,
            description: sanitizedInput.description,
            githubRepo: sanitizedInput.githubRepo,
            intent: sanitizedInput.intent,
            benefitToFortWorth: sanitizedInput.benefitToFortWorth,
            tags: tagsString,
            status: sanitizedInput.status,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(projects.id, id));

        // Get updated project with collaborator count
        const projectWithData = await db
          .select({
            id: projects.id,
            title: projects.title,
            description: projects.description,
            github_repo: projects.githubRepo,
            intent: projects.intent,
            benefit_to_fort_worth: projects.benefitToFortWorth,
            status: projects.status,
            tags: projects.tags,
            creator_id: projects.creatorId,
            creator_name: users.username,
            creator_avatar: users.avatarUrl,
            created_at: projects.createdAt,
            updated_at: projects.updatedAt,
            collaborators: sql<number>`COALESCE(
              (SELECT COUNT(*) + 1 FROM project_collaborators WHERE project_id = ${projects.id}), 
              1
            )`,
          })
          .from(projects)
          .leftJoin(users, eq(projects.creatorId, users.id))
          .where(eq(projects.id, id))
          .limit(1);

        return res.status(200).json(projectWithData[0]);
      } catch (error: any) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    else if (req.method === "DELETE") {
      // Delete project
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      // Check if project exists and user is the creator
      const existingProject = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id))
        .limit(1);

      if (existingProject.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (existingProject[0]!.creatorId !== user!.id) {
        return res.status(403).json({ error: "You can only delete your own projects" });
      }

      // Delete the project (this will cascade to collaborators and updates due to foreign keys)
      await db.delete(projects).where(eq(projects.id, id));

      return res.status(200).json({ message: "Project deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Projects API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}