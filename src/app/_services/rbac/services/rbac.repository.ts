import { db } from "@core/database";
import {
  roles,
  permissions,
  rolePermissions,
  memberRoles,
} from "@core/database/schema";
import { eq, and } from "drizzle-orm";
import { generateId } from "@shared/utils";

export class RbacRepository {
  async findAllRoles() {
    return db.select().from(roles).orderBy(roles.level);
  }

  async findRoleByName(name: string) {
    const results = await db
      .select()
      .from(roles)
      .where(eq(roles.name, name))
      .limit(1);
    return results[0] ?? null;
  }

  async findRoleById(id: string) {
    const results = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);
    return results[0] ?? null;
  }

  async findAllPermissions() {
    return db
      .select()
      .from(permissions)
      .orderBy(permissions.resource, permissions.action);
  }

  async findPermissionsByResource(resource: string) {
    return db
      .select()
      .from(permissions)
      .where(eq(permissions.resource, resource))
      .orderBy(permissions.action);
  }

  async findRolePermissions(roleId: string) {
    return db
      .select({
        id: permissions.id,
        resource: permissions.resource,
        action: permissions.action,
        description: permissions.description,
        createdAt: permissions.createdAt,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
  }

  async findMemberRoles(memberId: string) {
    return db
      .select({
        id: memberRoles.id,
        roleId: roles.id,
        roleName: roles.name,
        roleDisplayName: roles.displayName,
        level: roles.level,
        grantedAt: memberRoles.grantedAt,
        isActive: memberRoles.isActive,
      })
      .from(memberRoles)
      .innerJoin(roles, eq(memberRoles.roleId, roles.id))
      .where(
        and(eq(memberRoles.memberId, memberId), eq(memberRoles.isActive, true)),
      );
  }

  async hasMemberPermission(
    memberId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const result = await db
      .select({ permissionId: permissions.id })
      .from(memberRoles)
      .innerJoin(
        rolePermissions,
        eq(memberRoles.roleId, rolePermissions.roleId),
      )
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(memberRoles.memberId, memberId),
          eq(memberRoles.isActive, true),
          eq(permissions.resource, resource),
          eq(permissions.action, action),
        ),
      )
      .limit(1);

    return result.length > 0;
  }

  async assignRole(memberId: string, roleId: string, grantedBy?: string) {
    // Check if already active
    const existing = await db
      .select()
      .from(memberRoles)
      .where(
        and(
          eq(memberRoles.memberId, memberId),
          eq(memberRoles.roleId, roleId),
          eq(memberRoles.isActive, true),
        ),
      )
      .limit(1);

    if (existing[0]) {
      return existing[0];
    }

    const id = generateId();
    const now = new Date();

    await db.insert(memberRoles).values({
      id,
      memberId,
      roleId,
      grantedBy: grantedBy ?? null,
      grantedAt: now,
      isActive: true,
      createdAt: now,
    });

    const inserted = await db
      .select()
      .from(memberRoles)
      .where(eq(memberRoles.id, id))
      .limit(1);
    return inserted[0]!;
  }

  async revokeRole(memberId: string, roleId: string) {
    await db
      .update(memberRoles)
      .set({ isActive: false })
      .where(
        and(
          eq(memberRoles.memberId, memberId),
          eq(memberRoles.roleId, roleId),
          eq(memberRoles.isActive, true),
        ),
      );
  }

  async setRolePermissions(roleId: string, permissionIds: string[]) {
    // Delete existing
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

    // Insert new
    if (permissionIds.length > 0) {
      const now = new Date();
      await db.insert(rolePermissions).values(
        permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
          createdAt: now,
        })),
      );
    }
  }
}

export const rbacRepository = new RbacRepository();
