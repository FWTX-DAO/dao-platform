import type { NextApiRequest, NextApiResponse } from 'next';
import { compose, errorHandler, withAuth } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { activitiesService } from '@features/activities';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { limit } = req.query;
    const feed = await activitiesService.getPlatformFeed(limit ? Number(limit) : undefined);
    return apiResponse.success(res, feed);
  }

  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(errorHandler, withAuth)(handler);
