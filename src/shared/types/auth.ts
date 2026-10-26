import type { VerifyAccessTokenResponse } from "@privy-io/node";
import type { User } from "./database";

export interface AuthContext {
  user: User;
  claims: VerifyAccessTokenResponse;
  isAuthenticated: boolean;
}

export { type VerifyAccessTokenResponse };
