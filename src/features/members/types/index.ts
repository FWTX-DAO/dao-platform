import { z } from 'zod';
import { MEMBER_TYPES, MEMBERSHIP_STATUSES, CONTACT_METHODS, AVAILABILITY_OPTIONS } from '@shared/constants';
import type { Member as MemberDB, InsertMember } from '@shared/types';

export type Member = MemberDB;
export type CreateMember = InsertMember;

export interface MemberWithUser extends Member {
  username?: string | null;
  avatarUrl?: string | null;
}

export interface MemberWithProfile extends Member {
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  tierName?: string | null;
  tierDisplayName?: string | null;
  roleNames?: string[];
}

export interface MemberProfileFilters {
  city?: string;
  industry?: string;
  availability?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const UpdateMembershipSchema = z.object({
  membershipType: z.enum(MEMBER_TYPES as unknown as [string, ...string[]]).optional(),
  votingPower: z.number().int().positive().optional(),
  status: z.enum(MEMBERSHIP_STATUSES as unknown as [string, ...string[]]).optional(),
  badges: z.string().optional(),
  specialRoles: z.string().optional(),
});

export type UpdateMembershipInput = z.infer<typeof UpdateMembershipSchema>;

export const UpdateProfileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  preferredContactMethod: z.enum(CONTACT_METHODS as unknown as [string, ...string[]]).optional(),
  employer: z.string().max(200).optional(),
  jobTitle: z.string().max(200).optional(),
  industry: z.string().max(100).optional(),
  yearsOfExperience: z.number().int().min(0).max(60).optional(),
  civicInterests: z.string().optional(),
  skills: z.string().optional(),
  availability: z.enum(AVAILABILITY_OPTIONS as unknown as [string, ...string[]]).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  zip: z.string().max(10).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const CompleteOnboardingSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  termsAccepted: z.literal(true),
  phone: z.string().max(20).optional(),
  employer: z.string().max(200).optional(),
  jobTitle: z.string().max(200).optional(),
  industry: z.string().max(100).optional(),
  civicInterests: z.string().optional(),
  skills: z.string().optional(),
  availability: z.enum(AVAILABILITY_OPTIONS as unknown as [string, ...string[]]).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  zip: z.string().max(10).optional(),
});

export type CompleteOnboardingInput = z.infer<typeof CompleteOnboardingSchema>;
