import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { authenticateRequest, type AuthTokenClaims } from '../auth/privy';
import { UnauthorizedError } from '../errors/AppError';
import { getOrCreateUser } from '../database/queries/users';
import type { User } from '../database/schema';

export interface AuthenticatedRequest extends NextApiRequest {
  user: User;
  claims: AuthTokenClaims;
}

export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const claims = await authenticateRequest(req);
      const user = await getOrCreateUser(claims.userId, (claims as any).email);

      const authReq = req as AuthenticatedRequest;
      authReq.claims = claims;
      authReq.user = user!;

      return handler(req, res);
    } catch (error: any) {
      throw new UnauthorizedError(error.message);
    }
  };
}
