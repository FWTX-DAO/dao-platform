import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { authenticateRequest, type AuthTokenClaims } from '../auth/privy';
import { UnauthorizedError } from '../errors/AppError';
import type { User } from '../database/schema';

export interface AuthenticatedRequest extends NextApiRequest {
  user: User;
  claims: AuthTokenClaims;
}

export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const claims = await authenticateRequest(req);
      
      const authReq = req as AuthenticatedRequest;
      authReq.claims = claims;
      
      return handler(req, res);
    } catch (error: any) {
      throw new UnauthorizedError(error.message);
    }
  };
}
