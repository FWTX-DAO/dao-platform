'use server';

import { requireAuth } from '@/app/_lib/auth';
import { forumService } from '@features/forum';
import {
  db,
  projects,
  users,
  projectCollaborators,
  projectUpdates,
  members,
} from '@core/database';
import { eq, desc, sql } from 'drizzle-orm';
import { generateId } from '@utils/id-generator';
import { revalidatePath } from 'next/cache';

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

export async function createProject(data: {
  title: string;
  description: string;
  status?: string;
  githubRepo?: string;
  intent?: string;
  benefit?: string;
  tags?: string;
}) {
  const { user } = await requireAuth();

  const id = generateId();
  const now = new Date();

  await db.insert(projects).values({
    id,
    creatorId: user.id,
    title: data.title,
    description: data.description,
    status: data.status || 'active',
    githubRepo: data.githubRepo || '',
    intent: data.intent || '',
    benefitToFortWorth: data.benefit || '',
    tags: data.tags || null,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath('/innovation-lab');
  return { id };
}

export async function updateProject(id: string, data: Record<string, any>) {
  const { user } = await requireAuth();

  const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project[0]) throw new Error('Project not found');
  if (project[0].creatorId !== user.id) throw new Error('Not authorized');

  await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, id));

  revalidatePath('/innovation-lab');
  revalidatePath(`/innovation-lab/${id}`);
  return { success: true };
}

export async function deleteProject(id: string) {
  const { user } = await requireAuth();

  const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project[0]) throw new Error('Project not found');
  if (project[0].creatorId !== user.id) throw new Error('Not authorized');

  await db.delete(projects).where(eq(projects.id, id));
  revalidatePath('/innovation-lab');
  return { success: true };
}

export async function joinProject(id: string) {
  const { user } = await requireAuth();

  // Check if already a collaborator
  const existing = await db
    .select()
    .from(projectCollaborators)
    .where(eq(projectCollaborators.projectId, id))
    .then((rows) => rows.filter((r) => r.userId === user.id));

  if (existing.length > 0) {
    return { success: false, error: 'Already a collaborator' };
  }

  const now = new Date();
  await db.insert(projectCollaborators).values({
    projectId: id,
    userId: user.id,
    role: 'contributor',
  });

  // Award contribution points
  const member = await db.select().from(members).where(eq(members.userId, user.id)).limit(1);
  if (member[0]) {
    await db
      .update(members)
      .set({
        contributionPoints: sql`${members.contributionPoints} + 10`,
        updatedAt: now,
      })
      .where(eq(members.userId, user.id));
  }

  revalidatePath(`/innovation-lab/${id}`);
  return { success: true };
}

export async function getProjectUpdates(projectId: string) {
  await requireAuth();
  return db
    .select({
      id: projectUpdates.id,
      title: projectUpdates.title,
      content: projectUpdates.content,
      author_name: users.username,
      created_at: projectUpdates.createdAt,
    })
    .from(projectUpdates)
    .leftJoin(users, eq(projectUpdates.authorId, users.id))
    .where(eq(projectUpdates.projectId, projectId))
    .orderBy(desc(projectUpdates.createdAt));
}

export async function createProjectUpdate(projectId: string, data: { title: string; content: string }) {
  const { user } = await requireAuth();

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
  return { id };
}

export async function getProjectForum(projectId: string) {
  const { user } = await requireAuth();
  return forumService.getPostsWithMetadata(user.id, { projectId });
}

export async function createProjectForumPost(projectId: string, data: { title: string; content: string; category?: string }) {
  const { user } = await requireAuth();
  const result = await forumService.createPost({ ...data, category: data.category || 'General', projectId }, user.id);
  revalidatePath(`/innovation-lab/${projectId}`);
  return result;
}
