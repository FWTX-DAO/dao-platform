import { z } from 'zod';
import { VALIDATION_LIMITS, BOUNTY_STATUSES } from '@shared/constants';
import type { InnovationBounty as BountyDB, InsertInnovationBounty } from '@shared/types';

export type Bounty = BountyDB;
export type CreateBounty = InsertInnovationBounty;

export const CreateBountySchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required').max(VALIDATION_LIMITS.NAME_MAX_LENGTH),
  organizationType: z.enum(['civic', 'commercial', 'non-profit']),
  organizationContact: z.string().optional(),
  organizationWebsite: z.string().url().optional().or(z.literal('')),
  
  sponsorFirstName: z.string().optional(),
  sponsorLastName: z.string().optional(),
  sponsorEmail: z.string().email().optional().or(z.literal('')),
  sponsorPhone: z.string().optional(),
  sponsorTitle: z.string().optional(),
  sponsorDepartment: z.string().optional(),
  sponsorLinkedIn: z.string().url().optional().or(z.literal('')),
  
  organizationSize: z.string().optional(),
  organizationIndustry: z.string().optional(),
  organizationAddress: z.string().optional(),
  organizationCity: z.string().optional(),
  organizationState: z.string().optional(),
  organizationZip: z.string().optional(),
  
  title: z.string().min(1, 'Title is required').max(VALIDATION_LIMITS.TITLE_MAX_LENGTH),
  problemStatement: z.string().min(1, 'Problem statement is required').max(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH),
  useCase: z.string().min(1, 'Use case is required').max(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH),
  currentState: z.string().optional(),
  commonToolsUsed: z.string().optional(),
  desiredOutcome: z.string().min(1, 'Desired outcome is required').max(VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH),
  
  technicalRequirements: z.string().optional(),
  constraints: z.string().optional(),
  deliverables: z.string().optional(),
  
  bountyAmount: z.number().int().positive().optional(),
  bountyType: z.enum(['fixed', 'milestone-based', 'equity']).optional().default('fixed'),
  deadline: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  
  status: z.enum(BOUNTY_STATUSES as unknown as [string, ...string[]]).optional().default('draft'),
  isAnonymous: z.number().int().min(0).max(1).optional().default(0),
});

export type CreateBountyInput = z.infer<typeof CreateBountySchema>;

export interface BountyFilters {
  status?: string;
  category?: string;
  submitterId?: string;
}
