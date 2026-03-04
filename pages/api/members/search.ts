import type { NextApiRequest, NextApiResponse } from 'next';
import { compose, errorHandler, withAuth } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { membersService } from '@features/members';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { city, industry, availability, search, limit, offset } = req.query;
    const results = await membersService.searchMembers({
      city: city as string | undefined,
      industry: industry as string | undefined,
      availability: availability as string | undefined,
      search: search as string | undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    return apiResponse.success(res, results);
  }

  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(errorHandler, withAuth)(handler);
