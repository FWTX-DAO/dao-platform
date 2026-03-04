import type { NextApiRequest, NextApiResponse } from 'next';
import { compose, errorHandler, withAuth, withPermission } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { rbacService } from '@features/rbac';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const roles = await rbacService.getAllRoles();
    return apiResponse.success(res, roles);
  }

  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(errorHandler, withAuth, withPermission('admin', 'manage'))(handler);
