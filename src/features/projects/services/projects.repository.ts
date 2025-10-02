import { db } from '@core/database';
import { projects, users, projectCollaborators } from '@core/database/schema';
import { eq, sql, and, desc } from 'drizzle-orm';
import { generateId } from '@shared/utils';
import type { CreateProjectInput, ProjectFilters } from '../types';

export class ProjectsRepository {
  async findAll(filters?: ProjectFilters) {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(projects.status, filters.status));
    }

    if (filters?.creatorId) {
      conditions.push(eq(projects.creatorId, filters.creatorId));
    }

    const query = db
      .select({
        id: projects.id,
        creatorId: projects.creatorId,
        title: projects.title,
        description: projects.description,
        githubRepo: projects.githubRepo,
        intent: projects.intent,
        benefitToFortWorth: projects.benefitToFortWorth,
        status: projects.status,
        tags: projects.tags,
        creatorName: users.username,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .leftJoin(users, eq(projects.creatorId, users.id))
      .$dynamic();

    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(projects.createdAt));
    }
    
    return query.orderBy(desc(projects.createdAt));
  }

  async findById(id: string) {
    const results = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    
    return results[0] ?? null;
  }

  async create(data: CreateProjectInput, creatorId: string) {
    const id = generateId();
    await db.insert(projects).values({
      id,
      creatorId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    await db.insert(projectCollaborators).values({
      projectId: id,
      userId: creatorId,
      role: 'owner',
      joinedAt: new Date().toISOString(),
    });
    
    return this.findById(id);
  }

  async update(id: string, data: Partial<CreateProjectInput>) {
    await db.update(projects)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(projects.id, id));
    
    return this.findById(id);
  }

  async delete(id: string) {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getCollaboratorCount(projectId: string) {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(projectCollaborators)
      .where(eq(projectCollaborators.projectId, projectId));
    
    return result[0]?.count ?? 0;
  }

  async addCollaborator(projectId: string, userId: string, role: string = 'contributor') {
    await db.insert(projectCollaborators).values({
      projectId,
      userId,
      role,
      joinedAt: new Date().toISOString(),
    });
  }

  async removeCollaborator(projectId: string, userId: string) {
    await db.delete(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, userId)
        )
      );
  }

  async isCollaborator(projectId: string, userId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, userId)
        )
      )
      .limit(1);
    
    return result.length > 0;
  }
}

export const projectsRepository = new ProjectsRepository();
