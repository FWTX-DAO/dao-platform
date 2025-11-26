import { z } from 'zod';
import { VALIDATION_LIMITS, PROJECT_STATUSES } from '@shared/constants';
import type { Project as ProjectDB, InsertProject } from '@shared/types';

export type Project = ProjectDB;
export type CreateProject = InsertProject;

export interface ProjectWithMetadata extends Project {
  creatorName?: string | null;
  collaboratorCount: number;
}

export const CreateProjectSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(VALIDATION_LIMITS.TITLE_MAX_LENGTH, 'Title is too long'),
  description: z.string()
    .min(1, 'Description is required')
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH, 'Description is too long'),
  githubRepo: z.string()
    .min(1, 'GitHub repository is required')
    .url('Must be a valid URL')
    .refine(url => url.includes('github.com'), 'Must be a GitHub URL'),
  intent: z.string()
    .min(1, 'Intent is required')
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH, 'Intent is too long'),
  benefitToFortWorth: z.string()
    .min(1, 'Benefit to Fort Worth is required')
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH, 'Benefit description is too long'),
  status: z.enum(PROJECT_STATUSES as unknown as [string, ...string[]]).optional().default('proposed'),
  tags: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface ProjectFilters extends PaginationParams {
  status?: string;
  creatorId?: string;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
