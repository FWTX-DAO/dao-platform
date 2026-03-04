import type { NextApiRequest, NextApiResponse } from 'next';
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { subscriptionsService } from '@features/subscriptions';
import { membersService } from '@features/members';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { claims } = req as AuthenticatedRequest;

  if (req.method === 'GET') {
    const member = await membersService.getOrCreateMember(claims.userId);
    const sub = await subscriptionsService.getActiveSubscription(member!.id);
    return apiResponse.success(res, sub);
  }

  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(errorHandler, withAuth)(handler);
