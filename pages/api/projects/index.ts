import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, generateId } from "../../../lib/api-helpers";
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
      const { title, description, githubRepo, intent, benefitToFortWorth, tags } = req.body;

      if (!title || !description || !githubRepo || !intent || !benefitToFortWorth) {
        return res.status(400).json({ 
          error: "Title, description, GitHub repo, intent, and benefit to Fort Worth are required" 
        });
      }

      const projectId = generateId();
      const tagsString = Array.isArray(tags) ? tags.join(",") : tags || "";

      const newProject = await db.insert(projects).values({
        id: projectId,
        creatorId: user!.id,
        title,
        description,
        githubRepo,
        intent,
        benefitToFortWorth,
        tags: tagsString,
        status: "proposed",
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
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Projects API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}