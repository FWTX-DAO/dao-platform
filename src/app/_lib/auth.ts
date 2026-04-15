import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PrivyClient } from "@privy-io/server-auth";
import {
  getOrCreateUser,
  syncWalletAddress,
} from "@core/database/queries/users";
import { db } from "@core/database";
import { members, memberRoles, roles } from "@core/database/schema";
import { eq, and, or } from "drizzle-orm";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

export async function getAuthUser() {
  const token = (await cookies()).get("privy-token")?.value;
  if (!token) return null;
  try {
    const claims = await privy.verifyAuthToken(token);
    const user = await getOrCreateUser(claims.userId, (claims as any).email);

    // Sync wallet address from Privy (non-blocking)
    // Prefer external wallets (MetaMask, etc.) over embedded ones
    privy
      .getUser(claims.userId)
      .then((privyUser) => {
        const ethWallets = (privyUser?.linkedAccounts?.filter(
          (a: any) => a.type === "wallet" && a.chainType === "ethereum",
        ) ?? []) as any[];
        // Prefer external wallet; fall back to embedded
        const wallet =
          ethWallets.find((w: any) => w.walletClientType !== "privy") ??
          ethWallets[0];
        if (wallet?.address && user) {
          syncWalletAddress(user.id, wallet.address).catch((err) => {
            console.error("[auth] wallet sync DB write failed:", err);
          });
        }
      })
      .catch((err) => {
        console.error(
          "[auth] privy.getUser failed for wallet sync:",
          err?.message || err,
        );
      });

    return { claims, user: user! };
  } catch (err) {
    // Log non-token errors (token expiry is expected, DB errors are not)
    const isTokenError =
      err instanceof Error &&
      (err.message.includes("jwt") ||
        err.message.includes("token") ||
        err.message.includes("expired"));
    if (!isTokenError) {
      console.error("[auth] getAuthUser failed:", err);
    }
    return null;
  }
}

export async function requireAuth() {
  const auth = await getAuthUser();
  if (!auth) redirect("/");
  return auth;
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const adminRoles = await db
    .select()
    .from(memberRoles)
    .innerJoin(members, eq(memberRoles.memberId, members.id))
    .innerJoin(roles, eq(memberRoles.roleId, roles.id))
    .where(
      and(
        eq(members.userId, userId),
        eq(memberRoles.isActive, true),
        or(
          eq(roles.name, "admin"),
          eq(roles.name, "council_member"),
          eq(roles.name, "screener"),
        ),
      ),
    )
    .limit(1);
  return adminRoles.length > 0;
}

/**
 * Enforces admin access — redirects to '/' if the user is not an admin.
 * Use `checkAdmin()` if you need a soft check that returns `isAdmin: boolean`.
 */
export async function requireAdmin() {
  const auth = await requireAuth();
  const admin = await isUserAdmin(auth.user.id);
  if (!admin) redirect("/");
  return { ...auth, isAdmin: true as const };
}

/**
 * Soft admin check — returns `isAdmin: boolean` without redirecting.
 * Use when you need to conditionally return data based on admin status.
 */
export async function checkAdmin() {
  const auth = await requireAuth();
  const admin = await isUserAdmin(auth.user.id);
  return { ...auth, isAdmin: admin };
}

/**
 * Server-side entitlement check.
 * Returns true if user has at least member-level (level >= 10) RBAC role.
 */
export async function hasActiveMembership(userId: string): Promise<boolean> {
  const memberLevel = await db
    .select({ level: roles.level })
    .from(memberRoles)
    .innerJoin(members, eq(memberRoles.memberId, members.id))
    .innerJoin(roles, eq(memberRoles.roleId, roles.id))
    .where(and(eq(members.userId, userId), eq(memberRoles.isActive, true)))
    .orderBy(roles.level)
    .limit(1);
  return (memberLevel[0]?.level ?? 0) >= 10;
}
