import type { AuthTokenClaims } from '@privy-io/server-auth';
import type { User } from './database';

export interface AuthContext {
  user: User;
  claims: AuthTokenClaims;
  isAuthenticated: boolean;
}

export { type AuthTokenClaims };
