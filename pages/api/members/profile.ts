import type { NextApiRequest, NextApiResponse } from 'next';
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { membersService } from '@features/members';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest;

  if (req.method === 'GET') {
    // Ensure member exists before fetching profile
    await membersService.getOrCreateMember(user.id);
    const profile = await membersService.getMemberWithProfile(user.id);
    return apiResponse.success(res, profile);
  }

  if (req.method === 'PUT') {
    const updated = await membersService.updateMemberProfile(user.id, req.body);
    return apiResponse.success(res, updated);
  }

  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(errorHandler, withAuth)(handler);
