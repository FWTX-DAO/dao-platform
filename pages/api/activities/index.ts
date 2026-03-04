import type { NextApiRequest, NextApiResponse } from 'next';
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { activitiesService } from '@features/activities';
import { membersService } from '@features/members';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { claims } = req as AuthenticatedRequest;

  if (req.method === 'GET') {
    const member = await membersService.getMemberByUserId(claims.userId);
    const { type, limit, offset } = req.query;
    const activities = await activitiesService.getActivityFeed(member.id, {
      activityType: type as string | undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    return apiResponse.success(res, activities);
  }

  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(errorHandler, withAuth)(handler);
