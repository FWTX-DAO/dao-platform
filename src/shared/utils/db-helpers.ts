import { VerifyAccessTokenResponse } from "@privy-io/node";
import { dbOperations } from "../../core/database/client";
import type { User } from "../../core/database/schema";

/**
 * Get or create a user from Privy authentication claims
 * This ensures every authenticated user has a database record
 */
export async function getOrCreateUser(
  claims: VerifyAccessTokenResponse,
): Promise<User> {
  // Try to get existing user
  let user = await dbOperations.users.getByPrivyDid(claims.user_id);

  if (!user) {
    user = await dbOperations.users.upsertFromPrivy(claims.user_id);

    if (!user) {
      throw new Error("Failed to create user");
    }
  }

  return user;
}

/**
 * Helper to extract user ID from auth claims and ensure user exists
 */
export async function getUserIdFromClaims(
  claims: VerifyAccessTokenResponse,
): Promise<string> {
  const user = await getOrCreateUser(claims);
  return user.id;
}
