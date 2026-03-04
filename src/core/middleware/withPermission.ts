import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { db } from '@core/database';
import { members, memberRoles, rolePermissions, permissions } from '@core/database/schema';
import { eq, and } from 'drizzle-orm';
import { ForbiddenError } from '@core/errors/AppError';
import type { AuthenticatedRequest } from './withAuth';

/**
 * RBAC middleware — checks that the authenticated user holds a role
 * granting the requested (resource, action) permission.
 *
 * Usage: compose(errorHandler, withAuth, withPermission('admin', 'manage'))(handler)
 */
export function withPermission(resource: string, action: string) {
  return (handler: NextApiHandler) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.claims?.userId;

      if (!userId) {
        throw new ForbiddenError('Insufficient permissions');
      }

      // Resolve member from userId (Privy DID)
      const member = await db
        .select({ id: members.id })
        .from(members)
        .where(eq(members.userId, userId))
        .limit(1)
        .then((r) => r[0]);

      if (!member) {
        throw new ForbiddenError('Insufficient permissions');
      }

      // Single query: member_roles -> role_permissions -> permissions
      const match = await db
        .select({ permissionId: permissions.id })
        .from(memberRoles)
        .innerJoin(rolePermissions, eq(memberRoles.roleId, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
          and(
            eq(memberRoles.memberId, member.id),
            eq(memberRoles.isActive, true),
            eq(permissions.resource, resource),
            eq(permissions.action, action),
          ),
        )
        .limit(1)
        .then((r) => r[0]);

      if (!match) {
        throw new ForbiddenError('Insufficient permissions');
      }

      return handler(req, res);
    };
  };
}
