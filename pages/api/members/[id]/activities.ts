import type { NextApiRequest, NextApiResponse } from 'next';
import { compose, errorHandler, withAuth } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { activitiesService } from '@features/activities';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const memberId = id as string;

  if (req.method === 'GET') {
    const { type, limit, offset } = req.query;
    const activities = await activitiesService.getActivityFeed(memberId, {
      activityType: type as string | undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    return apiResponse.success(res, activities);
  }

  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(errorHandler, withAuth)(handler);
