import type { NextApiRequest, NextApiResponse } from 'next';
import { compose, errorHandler } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { subscriptionsService } from '@features/subscriptions';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const tiers = await subscriptionsService.getActiveTiers();
    return apiResponse.success(res, tiers);
  }

  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(errorHandler)(handler);
