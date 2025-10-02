import { z } from 'zod';
import { MEMBER_TYPES, MEMBERSHIP_STATUSES } from '@shared/constants';
import type { Member as MemberDB, InsertMember } from '@shared/types';

export type Member = MemberDB;
export type CreateMember = InsertMember;

export interface MemberWithUser extends Member {
  username?: string | null;
  avatarUrl?: string | null;
}

export const UpdateMembershipSchema = z.object({
  membershipType: z.enum(MEMBER_TYPES as unknown as [string, ...string[]]).optional(),
  votingPower: z.number().int().positive().optional(),
  status: z.enum(MEMBERSHIP_STATUSES as unknown as [string, ...string[]]).optional(),
  badges: z.string().optional(),
  specialRoles: z.string().optional(),
});

export type UpdateMembershipInput = z.infer<typeof UpdateMembershipSchema>;
