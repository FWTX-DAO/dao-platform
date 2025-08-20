import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "../../../../lib/api-helpers";
import { getOrCreateUser } from "../../../../src/db/queries/users";
import { db, projects, users, projectCollaborators } from "../../../../src/db";
import { eq } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    return handleGetProject(req, res);
  } else if (req.method === "PUT") {
    return handleUpdateProject(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleGetProject(req: NextApiRequest, res: NextApiResponse) {

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

    // Get project details with creator info
    const project = await db
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
      })
      .from(projects)
      .leftJoin(users, eq(projects.creatorId, users.id))
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Get all collaborators including the creator
    const collaborators = await db
      .select({
        user_id: projectCollaborators.userId,
        username: users.username,
        avatar_url: users.avatarUrl,
        role: projectCollaborators.role,
        joined_at: projectCollaborators.joinedAt,
      })
      .from(projectCollaborators)
      .leftJoin(users, eq(projectCollaborators.userId, users.id))
      .where(eq(projectCollaborators.projectId, projectId))
      .orderBy(projectCollaborators.joinedAt);

    // Add creator to collaborators list
    const allCollaborators = [
      {
        user_id: project[0]!.creator_id,
        username: project[0]!.creator_name,
        avatar_url: project[0]!.creator_avatar,
        role: "creator",
        joined_at: project[0]!.created_at,
      },
      ...collaborators,
    ];

    // Check if current user is already a collaborator or creator
    const isCollaborator = allCollaborators.some(collab => collab.user_id === user!.id);

    const projectDetails = {
      ...project[0],
      collaborators: allCollaborators,
      total_collaborators: allCollaborators.length,
      user_is_collaborator: isCollaborator,
      user_is_creator: project[0]!.creator_id === user!.id,
    };

    return res.status(200).json(projectDetails);
  } catch (error: any) {
    console.error("Project details API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

async function handleUpdateProject(req: NextApiRequest, res: NextApiResponse) {
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

    // Check if project exists and user is the creator
    const existingProject = await db
      .select({
        id: projects.id,
        creator_id: projects.creatorId,
      })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (existingProject.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (existingProject[0]!.creator_id !== user!.id) {
      return res.status(403).json({ error: "Only the project creator can update this project" });
    }

    // Extract and validate update data
    const {
      title,
      description,
      githubRepo,
      intent,
      benefitToFortWorth,
      tags,
      status,
    } = req.body;

    if (!title || !description || !githubRepo || !intent || !benefitToFortWorth) {
      return res.status(400).json({
        error: "All fields are required: title, description, githubRepo, intent, benefitToFortWorth"
      });
    }

    // Validate status
    if (status && !["proposed", "active", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'proposed', 'active', or 'completed'" });
    }

    // Update project
    const tagsString = Array.isArray(tags) ? tags.join(", ") : (tags || "");
    
    await db
      .update(projects)
      .set({
        title,
        description,
        githubRepo,
        intent,
        benefitToFortWorth,
        tags: tagsString,
        status: status || "proposed",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(projects.id, projectId));

    // Fetch and return the updated project details
    const updatedProject = await db
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
      })
      .from(projects)
      .leftJoin(users, eq(projects.creatorId, users.id))
      .where(eq(projects.id, projectId))
      .limit(1);

    // Get collaborators
    const collaborators = await db
      .select({
        user_id: projectCollaborators.userId,
        username: users.username,
        avatar_url: users.avatarUrl,
        role: projectCollaborators.role,
        joined_at: projectCollaborators.joinedAt,
      })
      .from(projectCollaborators)
      .leftJoin(users, eq(projectCollaborators.userId, users.id))
      .where(eq(projectCollaborators.projectId, projectId))
      .orderBy(projectCollaborators.joinedAt);

    // Add creator to collaborators list
    const allCollaborators = [
      {
        user_id: updatedProject[0]!.creator_id,
        username: updatedProject[0]!.creator_name,
        avatar_url: updatedProject[0]!.creator_avatar,
        role: "creator",
        joined_at: updatedProject[0]!.created_at,
      },
      ...collaborators,
    ];

    const projectDetails = {
      ...updatedProject[0],
      collaborators: allCollaborators,
      total_collaborators: allCollaborators.length,
      user_is_collaborator: true,
      user_is_creator: true,
    };

    return res.status(200).json(projectDetails);
  } catch (error: any) {
    console.error("Project update API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}