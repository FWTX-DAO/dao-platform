import { AuthTokenClaims } from "@privy-io/server-auth";
import { dbOperations } from "../src/db/client";
import type { User } from "../src/db/schema";

/**
 * Get or create a user from Privy authentication claims
 * This ensures every authenticated user has a database record
 */
export async function getOrCreateUser(claims: AuthTokenClaims): Promise<User> {
  // Try to get existing user
  let user = await dbOperations.users.getByPrivyDid(claims.userId);
  
  if (!user) {
    // Create new user if doesn't exist
    // The email might be in different formats depending on the auth method
    const email = (claims as any).email?.address || (claims as any).email || undefined;
    user = await dbOperations.users.upsertFromPrivy(
      claims.userId,
      email
    );
    
    if (!user) {
      throw new Error('Failed to create user');
    }
  }
  
  return user;
}

/**
 * Helper to extract user ID from auth claims and ensure user exists
 */
export async function getUserIdFromClaims(claims: AuthTokenClaims): Promise<string> {
  const user = await getOrCreateUser(claims);
  return user.id;
}