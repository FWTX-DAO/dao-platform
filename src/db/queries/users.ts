import { eq } from 'drizzle-orm';
import { db, users, type NewUser } from '../index';
import { generateId } from '../../../lib/id-generator';

/**
 * Get or create a user based on Privy DID
 * This ensures we always have a user record that syncs with Privy authentication
 */
export async function getOrCreateUser(privyDid: string, email?: string) {
  // First try to find existing user
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.privyDid, privyDid))
    .limit(1);

  if (existingUser.length > 0) {
    return existingUser[0];
  }

  // Create new user if doesn't exist
  const newUser: NewUser = {
    id: generateId(),
    privyDid,
    username: email?.split('@')[0] || `user_${generateId().slice(0, 8)}`,
    bio: null,
    avatarUrl: null,
  };

  const createdUser = await db.insert(users).values(newUser).returning();
  return createdUser[0];
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  privyDid: string,
  data: {
    username?: string;
    bio?: string;
    avatarUrl?: string;
  }
) {
  const updated = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.privyDid, privyDid))
    .returning();

  return updated[0];
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user[0] || null;
}

/**
 * Get user by Privy DID
 */
export async function getUserByPrivyDid(privyDid: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.privyDid, privyDid))
    .limit(1);

  return user[0] || null;
}