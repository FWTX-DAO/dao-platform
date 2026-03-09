"use server";

import { requireAuth, isUserAdmin } from "@/app/_lib/auth";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/app/_lib/action-utils";
import { forumService } from "@services/forum";
import { activitiesService } from "@services/activities";
import {
  db,
  projects,
  users,
  projectCollaborators,
  projectUpdates,
  members,
} from "@core/database";
import { eq, desc, sql, and } from "drizzle-orm";
import { generateId } from "@utils/id-generator";
import { revalidatePath } from "next/cache";

// ============================================================================
// QUERIES (return data directly — auth failure triggers redirect)
// ============================================================================

export async function getProjects() {
  await requireAuth();

  return db
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      status: projects.status,
      githubRepo: projects.githubRepo,
      intent: projects.intent,
      tags: projects.tags,
      creator_name: users.username,
      creator_id: projects.creatorId,
      created_at: projects.createdAt,
      updated_at: projects.updatedAt,
      collaborators: sql<number>`COALESCE(
        (SELECT COUNT(*) + 1 FROM project_collaborators WHERE project_id = ${projects.id}),
        1
      )`,
    })
    .from(projects)
    .leftJoin(users, eq(projects.creatorId, users.id))
    .orderBy(desc(projects.updatedAt));
}

export async function getProjectById(id: string) {
  const { user } = await requireAuth();

  const [project, collaborators] = await Promise.all([
    db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        status: projects.status,
        githubRepo: projects.githubRepo,
        intent: projects.intent,
        benefit: projects.benefitToFortWorth,
        tags: projects.tags,
        creator_name: users.username,
        creator_id: projects.creatorId,
        created_at: projects.createdAt,
        updated_at: projects.updatedAt,
      })
      .from(projects)
      .leftJoin(users, eq(projects.creatorId, users.id))
      .where(eq(projects.id, id))
      .limit(1),
    db
      .select({
        userId: projectCollaborators.userId,
        username: users.username,
        role: projectCollaborators.role,
        joinedAt: projectCollaborators.joinedAt,
      })
      .from(projectCollaborators)
      .leftJoin(users, eq(projectCollaborators.userId, users.id))
      .where(eq(projectCollaborators.projectId, id)),
  ]);

  if (!project[0]) return null;

  const p = project[0];
  const isCreator = p.creator_id === user.id;
  const isCollaborator = collaborators.some((c) => c.userId === user.id);

  return {
    ...p,
    collaborators,
    user_is_creator: isCreator,
    user_is_collaborator: isCollaborator || isCreator,
    total_collaborators: collaborators.length + 1,
  };
}

export async function getProjectUpdates(projectId: string) {
  await requireAuth();
  return db
    .select({
      id: projectUpdates.id,
      title: projectUpdates.title,
      content: projectUpdates.content,
      updateType: projectUpdates.updateType,
      author_name: users.username,
      authorId: projectUpdates.authorId,
      created_at: projectUpdates.createdAt,
    })
    .from(projectUpdates)
    .leftJoin(users, eq(projectUpdates.authorId, users.id))
    .where(eq(projectUpdates.projectId, projectId))
    .orderBy(desc(projectUpdates.createdAt));
}

export async function getProjectForum(projectId: string) {
  const { user } = await requireAuth();
  return forumService.getPostsWithMetadata(user.id, { projectId });
}

// ============================================================================
// MUTATIONS (return ActionResult<T> — never throw raw errors)
// ============================================================================

export async function createProject(data: {
  title: string;
  description: string;
  status?: string;
  githubRepo?: string;
  intent?: string;
  benefit?: string;
  tags?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await requireAuth();

    const id = generateId();
    const now = new Date();

    await db.insert(projects).values({
      id,
      creatorId: user.id,
      title: data.title,
      description: data.description,
      status: data.status || "active",
      githubRepo: data.githubRepo || "",
      intent: data.intent || "",
      benefitToFortWorth: data.benefit || "",
      tags: data.tags || null,
      createdAt: now,
      updatedAt: now,
    });

    // Auto-add creator as collaborator with 'creator' role
    await db.insert(projectCollaborators).values({
      projectId: id,
      userId: user.id,
      role: "creator",
    });

    // Track activity (non-blocking)
    activitiesService
      .trackActivity(user.id, "project_created", "project", id)
      .catch(() => {});

    revalidatePath("/innovation-lab");
    return actionSuccess({ id });
  } catch (err) {
    return actionError(err);
  }
}

export async function updateProject(
  id: string,
  data: Record<string, any>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { user } = await requireAuth();

    const project = await db
      .select({ creatorId: projects.creatorId })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (!project[0]) return actionError(new Error("Project not found"));

    const admin = await isUserAdmin(user.id);
    if (project[0].creatorId !== user.id && !admin) {
      return actionError(new Error("Not authorized"));
    }

    // Field allowlist for projects
    const allowedFields = [
      "title",
      "description",
      "githubRepo",
      "intent",
      "benefitToFortWorth",
      "tags",
      "status",
    ];
    const safeData = Object.fromEntries(
      Object.entries(data).filter(([k]) => allowedFields.includes(k)),
    );

    await db
      .update(projects)
      .set({ ...safeData, updatedAt: new Date() })
      .where(eq(projects.id, id));

    revalidatePath("/innovation-lab");
    revalidatePath(`/innovation-lab/${id}`);
    return actionSuccess({ success: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteProject(
  id: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { user } = await requireAuth();

    const project = await db
      .select({ creatorId: projects.creatorId })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (!project[0]) return actionError(new Error("Project not found"));

    const admin = await isUserAdmin(user.id);
    if (project[0].creatorId !== user.id && !admin) {
      return actionError(new Error("Not authorized"));
    }

    await db.delete(projects).where(eq(projects.id, id));
    revalidatePath("/innovation-lab");
    return actionSuccess({ success: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function joinProject(
  id: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { user } = await requireAuth();

    // Check if already a collaborator
    const existing = await db
      .select({ userId: projectCollaborators.userId })
      .from(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, id),
          eq(projectCollaborators.userId, user.id),
        ),
      )
      .limit(1);

    if (existing[0]) return actionError(new Error("Already a collaborator"));

    await db.insert(projectCollaborators).values({
      projectId: id,
      userId: user.id,
      role: "contributor",
    });

    // Award contribution points
    const member = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.userId, user.id))
      .limit(1);
    if (member[0]) {
      await db
        .update(members)
        .set({
          contributionPoints: sql`${members.contributionPoints} + 10`,
          updatedAt: new Date(),
        })
        .where(eq(members.userId, user.id));
    }

    // Track activity (non-blocking)
    activitiesService
      .trackActivity(user.id, "project_joined", "project", id)
      .catch(() => {});

    revalidatePath(`/innovation-lab/${id}`);
    revalidatePath("/innovation-lab");
    return actionSuccess({ success: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function leaveProject(
  id: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { user } = await requireAuth();

    // Don't allow creator to leave
    const project = await db
      .select({ creatorId: projects.creatorId })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (!project[0]) return actionError(new Error("Project not found"));
    if (project[0].creatorId === user.id)
      return actionError(new Error("Creator cannot leave the project"));

    await db
      .delete(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, id),
          eq(projectCollaborators.userId, user.id),
        ),
      );

    revalidatePath(`/innovation-lab/${id}`);
    revalidatePath("/innovation-lab");
    return actionSuccess({ success: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function createProjectUpdate(
  projectId: string,
  data: { title: string; content: string },
): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await requireAuth();

    // Verify user is a collaborator or creator
    const [project, collab] = await Promise.all([
      db
        .select({ creatorId: projects.creatorId })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1),
      db
        .select({ userId: projectCollaborators.userId })
        .from(projectCollaborators)
        .where(
          and(
            eq(projectCollaborators.projectId, projectId),
            eq(projectCollaborators.userId, user.id),
          ),
        )
        .limit(1),
    ]);

    if (!project[0]) return actionError(new Error("Project not found"));
    if (project[0].creatorId !== user.id && !collab[0]) {
      return actionError(new Error("Only collaborators can post updates"));
    }

    const id = generateId();
    const now = new Date();

    await db.insert(projectUpdates).values({
      id,
      projectId,
      authorId: user.id,
      title: data.title,
      content: data.content,
      createdAt: now,
    });

    revalidatePath(`/innovation-lab/${projectId}`);
    return actionSuccess({ id });
  } catch (err) {
    return actionError(err);
  }
}

export async function createProjectForumPost(
  projectId: string,
  data: { title: string; content: string; category?: string },
): Promise<ActionResult<any>> {
  try {
    const { user } = await requireAuth();
    const result = await forumService.createPost(
      { ...data, category: data.category || "General", projectId },
      user.id,
    );
    revalidatePath(`/innovation-lab/${projectId}`);
    return actionSuccess(result);
  } catch (err) {
    return actionError(err);
  }
}
