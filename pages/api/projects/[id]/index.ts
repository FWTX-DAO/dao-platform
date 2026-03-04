import type { NextApiResponse } from "next";
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from "@core/middleware";
import { ValidationError, NotFoundError, ForbiddenError } from "@core/errors/AppError";
import { db, projects, users, projectCollaborators } from "@core/database";
import { eq } from "drizzle-orm";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user;
  const projectId = req.query.id as string;

  if (!projectId) {
    throw new ValidationError("Project ID is required");
  }

  if (req.method === "GET") {
    // Fetch project and collaborators in parallel
    const [project, collaborators] = await Promise.all([
      db
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
        .limit(1),
      db
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
        .orderBy(projectCollaborators.joinedAt),
    ]);

    if (project.length === 0) {
      throw new NotFoundError("Project");
    }

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

    const isCollaborator = allCollaborators.some(collab => collab.user_id === user.id);

    return res.status(200).json({
      ...project[0],
      collaborators: allCollaborators,
      total_collaborators: allCollaborators.length,
      user_is_collaborator: isCollaborator,
      user_is_creator: project[0]!.creator_id === user.id,
    });
  }

  if (req.method === "PUT") {
    const existingProject = await db
      .select({ id: projects.id, creator_id: projects.creatorId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (existingProject.length === 0) {
      throw new NotFoundError("Project");
    }

    if (existingProject[0]!.creator_id !== user.id) {
      throw new ForbiddenError("Only the project creator can update this project");
    }

    const { title, description, githubRepo, intent, benefitToFortWorth, tags, status } = req.body;

    if (!title || !description || !githubRepo || !intent || !benefitToFortWorth) {
      throw new ValidationError("All fields are required: title, description, githubRepo, intent, benefitToFortWorth");
    }

    if (status && !["proposed", "active", "completed"].includes(status)) {
      throw new ValidationError("Invalid status. Must be 'proposed', 'active', or 'completed'");
    }

    const tagsString = Array.isArray(tags) ? tags.join(", ") : (tags || "");

    await db
      .update(projects)
      .set({
        title, description, githubRepo, intent, benefitToFortWorth,
        tags: tagsString,
        status: status || "proposed",
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    // Fetch updated project and collaborators in parallel
    const [updatedProject, collaborators] = await Promise.all([
      db
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
        .limit(1),
      db
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
        .orderBy(projectCollaborators.joinedAt),
    ]);

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

    return res.status(200).json({
      ...updatedProject[0],
      collaborators: allCollaborators,
      total_collaborators: allCollaborators.length,
      user_is_collaborator: true,
      user_is_creator: true,
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default compose(errorHandler, withAuth)(handler);
