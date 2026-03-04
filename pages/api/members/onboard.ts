import type { NextApiRequest, NextApiResponse } from 'next';
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { membersService } from '@features/members';
import { getOrCreateUser } from '@core/database/queries/users';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { claims } = req as AuthenticatedRequest;

  if (req.method === 'POST') {
    const email = (claims as any).email || undefined;

    // Ensure user exists
    const user = await getOrCreateUser(claims.userId, email);
    if (!user) {
      return apiResponse.error(res, 'Failed to create user', 500);
    }

    // Ensure member exists
    await membersService.getOrCreateMember(user.id);

    // Complete onboarding with profile data
    const result = await membersService.completeOnboarding(user.id, req.body);
    return apiResponse.success(res, result);
  }

  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(errorHandler, withAuth)(handler);
