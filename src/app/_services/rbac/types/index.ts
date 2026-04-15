import { z } from "zod";
import { ROLE_NAMES } from "@shared/constants";
import type { Role, Permission } from "@core/database/schema";

// Schemas
export const AssignRoleSchema = z.object({
  roleName: z.enum(ROLE_NAMES as unknown as [string, ...string[]]),
  memberId: z.string().min(1),
});

export const SetRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string().min(1)).min(1),
});

// Inferred types
export type AssignRoleInput = z.infer<typeof AssignRoleSchema>;
export type SetRolePermissionsInput = z.infer<typeof SetRolePermissionsSchema>;

// Composite types
export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface MemberWithRoles {
  memberId: string;
  roles: Array<{
    roleId: string;
    roleName: string;
    roleDisplayName: string;
    level: number;
    grantedAt: string;
    isActive: number;
  }>;
}
