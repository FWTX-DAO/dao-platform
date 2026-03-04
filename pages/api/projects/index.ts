import type { NextApiResponse } from "next";
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from "@core/middleware";
import { ValidationError, NotFoundError, ForbiddenError } from "@core/errors/AppError";
import { generateId } from "@utils/api-helpers";
import { sanitizeProjectInput } from "@utils/utils";
import { db, projects, users } from "@core/database";
import { eq, sql } from "drizzle-orm";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user;

  if (req.method === "GET") {
    const projectsList = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        github_repo: projects.githubRepo,
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
      .orderBy(sql`${projects.createdAt} DESC`);

    return res.status(200).json(projectsList);
  }

  if (req.method === "POST") {
    const rawInput = req.body;

    if (!rawInput.title || !rawInput.description || !rawInput.githubRepo ||
        !rawInput.intent || !rawInput.benefitToFortWorth) {
      throw new ValidationError("Title, description, GitHub repo, intent, and benefit to Fort Worth are required");
    }

    const sanitizedInput = sanitizeProjectInput({
      title: rawInput.title,
      description: rawInput.description,
      githubRepo: rawInput.githubRepo,
      intent: rawInput.intent,
      benefitToFortWorth: rawInput.benefitToFortWorth,
      tags: rawInput.tags,
    });

    if (!sanitizedInput.title || !sanitizedInput.description ||
        !sanitizedInput.githubRepo || !sanitizedInput.intent ||
        !sanitizedInput.benefitToFortWorth) {
      throw new ValidationError("Required fields cannot be empty after sanitization");
    }

    const projectId = generateId();
    const tagsString = sanitizedInput.tags.join(",");

    const newProject = await db.insert(projects).values({
      id: projectId,
      creatorId: user.id,
      title: sanitizedInput.title,
      description: sanitizedInput.description,
      githubRepo: sanitizedInput.githubRepo,
      intent: sanitizedInput.intent,
      benefitToFortWorth: sanitizedInput.benefitToFortWorth,
      tags: tagsString,
      status: sanitizedInput.status,
    }).returning();

    return res.status(201).json({
      ...newProject[0],
      github_repo: newProject[0]!.githubRepo,
      benefit_to_fort_worth: newProject[0]!.benefitToFortWorth,
      creator_name: user.username,
      creator_avatar: user.avatarUrl,
      collaborators: 1,
    });
  }

  if (req.method === "PUT") {
    const { id, title, description, githubRepo, intent, benefitToFortWorth, tags, status } = req.body;

    if (!id || !title || !description || !githubRepo || !intent || !benefitToFortWorth) {
      throw new ValidationError("ID and all required fields are needed");
    }

    const existingProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (existingProject.length === 0) {
      throw new NotFoundError("Project");
    }

    if (existingProject[0]!.creatorId !== user.id) {
      throw new ForbiddenError("You can only edit your own projects");
    }

    const sanitizedInput = sanitizeProjectInput({
      title, description, githubRepo, intent, benefitToFortWorth, tags, status,
    });

    if (!sanitizedInput.title || !sanitizedInput.description ||
        !sanitizedInput.githubRepo || !sanitizedInput.intent ||
        !sanitizedInput.benefitToFortWorth) {
      throw new ValidationError("Required fields cannot be empty after sanitization");
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
  }

  if (req.method === "DELETE") {
    const { id } = req.body;

    if (!id) {
      throw new ValidationError("Project ID is required");
    }

    const existingProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (existingProject.length === 0) {
      throw new NotFoundError("Project");
    }

    if (existingProject[0]!.creatorId !== user.id) {
      throw new ForbiddenError("You can only delete your own projects");
    }

    await db.delete(projects).where(eq(projects.id, id));
    return res.status(200).json({ message: "Project deleted successfully" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default compose(errorHandler, withAuth)(handler);
