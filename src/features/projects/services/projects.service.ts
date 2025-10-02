import { ProjectsRepository } from './projects.repository';
import { NotFoundError, ForbiddenError } from '@core/errors';
import type { CreateProjectInput, ProjectFilters, ProjectWithMetadata } from '../types';

export class ProjectsService {
  constructor(private repository: ProjectsRepository) {}

  async getProjectsWithMetadata(filters?: ProjectFilters): Promise<ProjectWithMetadata[]> {
    const projectList = await this.repository.findAll(filters);
    
    return Promise.all(
      projectList.map(async (project) => ({
        ...project,
        collaboratorCount: await this.repository.getCollaboratorCount(project.id),
      }))
    );
  }

  async getProjectById(id: string): Promise<ProjectWithMetadata> {
    const project = await this.repository.findById(id);
    
    if (!project) {
      throw new NotFoundError('Project');
    }
    
    return {
      ...project,
      collaboratorCount: await this.repository.getCollaboratorCount(id),
    };
  }

  async createProject(data: CreateProjectInput, userId: string) {
    return this.repository.create(data, userId);
  }

  async updateProject(id: string, data: Partial<CreateProjectInput>, userId: string) {
    const project = await this.repository.findById(id);
    
    if (!project) {
      throw new NotFoundError('Project');
    }
    
    if (project.creatorId !== userId) {
      throw new ForbiddenError('Only the project creator can update the project');
    }
    
    return this.repository.update(id, data);
  }

  async deleteProject(id: string, userId: string) {
    const project = await this.repository.findById(id);
    
    if (!project) {
      throw new NotFoundError('Project');
    }
    
    if (project.creatorId !== userId) {
      throw new ForbiddenError('Only the project creator can delete the project');
    }
    
    await this.repository.delete(id);
  }

  async joinProject(projectId: string, userId: string, role: string = 'contributor') {
    const project = await this.repository.findById(projectId);
    
    if (!project) {
      throw new NotFoundError('Project');
    }
    
    const isAlreadyCollaborator = await this.repository.isCollaborator(projectId, userId);
    
    if (isAlreadyCollaborator) {
      throw new Error('User is already a collaborator');
    }
    
    await this.repository.addCollaborator(projectId, userId, role);
  }

  async leaveProject(projectId: string, userId: string) {
    const project = await this.repository.findById(projectId);
    
    if (!project) {
      throw new NotFoundError('Project');
    }
    
    if (project.creatorId === userId) {
      throw new ForbiddenError('Project creator cannot leave the project');
    }
    
    await this.repository.removeCollaborator(projectId, userId);
  }
}

export const projectsService = new ProjectsService(new ProjectsRepository());
