import { eq } from "drizzle-orm";
import { db, users, members, type NewUser, type User } from "../index";
import { generateId } from "../../../shared/utils/id-generator";

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
 * Invalidate cache entries matching a given database userId.
 * Use after writes that only carry the DB uuid (not the privyDid).
 */
export function invalidateUserCacheByUserId(userId: string): void {
  for (const [key, entry] of userCache.entries()) {
    if (entry.user.id === userId) {
      userCache.delete(key);
    }
  }
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

  // Email-based dedup: if a member with this email already exists,
  // link the new Privy DID to the existing user instead of creating a duplicate.
  //
  // Trust boundary: `email` here comes from Privy's verified auth token claims,
  // so we treat its ownership as proven. Callers must not pass unverified input.
  if (email) {
    const existingMember = await db
      .select({ userId: members.userId })
      .from(members)
      .where(eq(members.email, email))
      .limit(1);

    if (existingMember.length > 0) {
      const existingUserId = existingMember[0]!.userId;
      try {
        const updated = await db
          .update(users)
          .set({ privyDid, updatedAt: new Date() })
          .where(eq(users.id, existingUserId))
          .returning();

        if (updated.length > 0) {
          const user = updated[0]!;
          console.log(
            `[auth] Email dedup: linked new Privy DID to existing user ${user.id} via email ${email}`,
          );
          setCachedUser(privyDid, user);
          return user;
        }
      } catch (err: any) {
        // 23505 = unique violation on privy_did — the new DID already points
        // at a different user row. Fall through and create a duplicate so
        // auth doesn't break, but log loudly so we can merge manually.
        if (err?.code === "23505") {
          console.error(
            `[auth] DUP_USER: cannot merge — privy_did ${privyDid} already exists separately from member email ${email} (existing user ${existingUserId}). Manual reconciliation required.`,
          );
        } else {
          throw err;
        }
      }
    }
  }

  // Create new user if no match by DID or email
  const newUser: NewUser = {
    id: generateId(),
    privyDid,
    username: email?.split("@")[0] || `user_${generateId().slice(0, 8)}`,
    bio: null,
    avatarUrl: null,
  };

  const createdUser = await db.insert(users).values(newUser).returning();
  const user = createdUser[0]!;
  setCachedUser(privyDid, user);
  return user;
}

/**
 * Sync wallet address from Privy to the users table.
 * Called during auth when a wallet address is available.
 * Populates empty slots (null → address) but does NOT overwrite an
 * existing non-null address with a different one — use saveVerifiedWallet
 * for intentional wallet changes.
 */
export async function syncWalletAddress(userId: string, walletAddress: string) {
  const normalized = walletAddress.toLowerCase();

  const existing = await db
    .select({ walletAddress: users.walletAddress })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const storedAddress = existing[0]?.walletAddress;

  // Already current — nothing to do
  if (storedAddress === normalized) return;

  // Don't overwrite an existing different wallet address.
  // Intentional wallet changes must go through saveVerifiedWallet
  // (which requires a fresh ownership signature).
  if (storedAddress !== null) return;

  await db
    .update(users)
    .set({ walletAddress: normalized, updatedAt: new Date() })
    .where(eq(users.id, userId));
  invalidateUserCacheByUserId(userId);
}

/**
 * Save a verified wallet address (after signature verification).
 * Normalizes the address to lowercase and rejects claims on a wallet
 * already verified by a different user.
 */
export async function saveVerifiedWallet(
  userId: string,
  walletAddress: string,
) {
  const normalized = walletAddress.toLowerCase();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.walletAddress, normalized))
    .limit(1);

  if (existing[0] && existing[0].id !== userId) {
    throw new Error(
      "This wallet is already verified on another account. Disconnect it there first.",
    );
  }

  await db
    .update(users)
    .set({
      walletAddress: normalized,
      walletVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  invalidateUserCacheByUserId(userId);
}

/**
 * Remove wallet address from a user.
 */
export async function removeWalletAddress(userId: string) {
  await db
    .update(users)
    .set({ walletAddress: null, walletVerifiedAt: null, updatedAt: new Date() })
    .where(eq(users.id, userId));
  invalidateUserCacheByUserId(userId);
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
  },
) {
  invalidateUserCache(privyDid);

  const updated = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.privyDid, privyDid))
    .returning();

  const user = updated[0];
  if (user) {
    setCachedUser(privyDid, user);
  }
  return user;
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
