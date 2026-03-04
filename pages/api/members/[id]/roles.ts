import type { NextApiRequest, NextApiResponse } from 'next';
import { compose, errorHandler, withAuth, withPermission, type AuthenticatedRequest } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { rbacService, AssignRoleSchema } from '@features/rbac';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const memberId = id as string;
  const { claims } = req as AuthenticatedRequest;

  if (req.method === 'GET') {
    const roles = await rbacService.getMemberRoles(memberId);
    return apiResponse.success(res, roles);
  }

  if (req.method === 'POST') {
    const parsed = AssignRoleSchema.parse({ ...req.body, memberId });
    const result = await rbacService.assignRole(parsed.memberId, parsed.roleName, claims.userId);
    return apiResponse.success(res, result, 201);
  }

  if (req.method === 'DELETE') {
    const { roleName } = req.body;
    if (!roleName) return apiResponse.error(res, 'roleName is required');
    await rbacService.revokeRole(memberId, roleName);
    return apiResponse.success(res, { message: 'Role revoked' });
  }

  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(errorHandler, withAuth, withPermission('admin', 'manage'))(handler);
