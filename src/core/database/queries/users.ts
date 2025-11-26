import { eq } from 'drizzle-orm';
import { db, users, type NewUser, type User } from '../index';
import { generateId } from '../../../shared/utils/id-generator';

/**
 * Simple in-memory cache for user lookups
 * Reduces database queries for repeated user lookups within a short time window
 */
interface CacheEntry {
  user: User;
  timestamp: number;
}

const userCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache TTL

function getCachedUser(privyDid: string): User | null {
  const entry = userCache.get(privyDid);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.user;
  }
  // Remove stale entry
  if (entry) {
    userCache.delete(privyDid);
  }
  return null;
}

function setCachedUser(privyDid: string, user: User): void {
  // Limit cache size to prevent memory issues
  if (userCache.size > 1000) {
    // Remove oldest entries
    const entries = Array.from(userCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 100; i++) {
      userCache.delete(entries[i]![0]);
    }
  }
  userCache.set(privyDid, { user, timestamp: Date.now() });
}

/**
 * Invalidate cache for a specific user (call after updates)
 */
export function invalidateUserCache(privyDid: string): void {
  userCache.delete(privyDid);
}

/**
 * Get or create a user based on Privy DID
 * This ensures we always have a user record that syncs with Privy authentication
 * Uses in-memory caching to reduce database lookups
 */
export async function getOrCreateUser(privyDid: string, email?: string) {
  // Check cache first
  const cachedUser = getCachedUser(privyDid);
  if (cachedUser) {
    return cachedUser;
  }

  // First try to find existing user
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.privyDid, privyDid))
    .limit(1);

  if (existingUser.length > 0) {
    const user = existingUser[0]!;
    setCachedUser(privyDid, user);
    return user;
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
  const user = createdUser[0]!;
  setCachedUser(privyDid, user);
  return user;
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