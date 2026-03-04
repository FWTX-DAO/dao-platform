import type { NextApiRequest, NextApiResponse } from 'next';
import { compose, errorHandler, withAuth, withPermission } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { rbacService, SetRolePermissionsSchema } from '@features/rbac';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const roleId = id as string;

  if (req.method === 'GET') {
    const permissions = await rbacService.getRolePermissions(roleId);
    return apiResponse.success(res, permissions);
  }

  if (req.method === 'PUT') {
    const parsed = SetRolePermissionsSchema.parse(req.body);
    await rbacService.setRolePermissions(roleId, parsed.permissionIds);
    const updated = await rbacService.getRolePermissions(roleId);
    return apiResponse.success(res, updated);
  }

  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(errorHandler, withAuth, withPermission('admin', 'manage'))(handler);
