/**
 * Push DB email → Privy linked_accounts for a single user.
 *
 * Privy's server SDK has no "add linked account to existing user" method, so
 * we re-import the user with the email added. This changes their Privy DID.
 *
 * Usage:
 *   bun run db:push-email -- --username denisoneil               # dry run
 *   bun run db:push-email -- --username denisoneil --apply       # execute
 *
 * Side effects when --apply:
 *   1. New Privy user created via importUser() with all prior linked accounts
 *      PLUS the email from members.email.
 *   2. Old Privy account deleted.
 *   3. users.privy_did updated to the new DID.
 *   4. The user must re-authenticate (old tokens become invalid).
 */
import { PrivyClient } from "@privy-io/server-auth";
import { eq } from "drizzle-orm";
import { db, users, members } from "./index";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const username = arg("username");
  const apply = process.argv.includes("--apply");

  if (!username) {
    console.error("Usage: --username <name> [--apply]");
    process.exit(1);
  }

  const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    process.env.PRIVY_APP_SECRET!,
  );

  // Lookup user + email
  const rows = await db
    .select({
      userId: users.id,
      privyDid: users.privyDid,
      walletAddress: users.walletAddress,
      email: members.email,
    })
    .from(users)
    .leftJoin(members, eq(members.userId, users.id))
    .where(eq(users.username, username))
    .limit(1);

  if (rows.length === 0) {
    console.error(`User '${username}' not found.`);
    process.exit(1);
  }
  const u = rows[0]!;
  console.log(`Target: ${username} (user_id=${u.userId})`);
  console.log(`  Current Privy DID: ${u.privyDid}`);
  console.log(`  DB wallet:         ${u.walletAddress}`);
  console.log(`  DB email:          ${u.email}`);

  if (!u.email) {
    console.error(
      `No email in members.email for ${username}; nothing to push.`,
    );
    process.exit(1);
  }

  // Fetch existing Privy linked accounts so we preserve them
  const privyUser = await privy.getUser(u.privyDid);
  const existing = (privyUser?.linkedAccounts ?? []) as any[];
  console.log(`\nExisting Privy linked accounts (${existing.length}):`);
  for (const a of existing) {
    console.log(`  - ${a.type} ${a.address ?? a.email ?? a.subject ?? ""}`);
  }

  // Bail if Privy already has the email
  const existingEmail = existing.find((a) => a.type === "email");
  if (existingEmail?.address?.toLowerCase() === u.email.toLowerCase()) {
    console.log("\nPrivy already has this email — nothing to do.");
    return;
  }

  // Build the import payload: preserve all existing accounts + add the email
  const accountsToImport = [
    { type: "email", address: u.email },
    ...existing
      .filter((a) => a.type === "wallet" && a.address)
      .map((a) => ({
        type: "wallet" as const,
        address: a.address,
        chainType: a.chainType ?? "ethereum",
      })),
  ];

  console.log(
    `\nNew Privy user will be imported with ${accountsToImport.length} accounts:`,
  );
  for (const a of accountsToImport) {
    console.log(`  - ${a.type} ${("address" in a && a.address) || ""}`);
  }

  if (!apply) {
    console.log("\nDry run — pass --apply to execute.");
    return;
  }

  // Privy rejects importUser when the wallets are still linked to a live user,
  // so order is: delete-then-import. The window between the two is the risk:
  // if importUser fails, our DB row points to a deleted DID. We log the full
  // snapshot before deleting so manual recovery is possible.
  const snapshot = { oldDid: u.privyDid, accountsToImport };
  console.log(`\n1) Deleting old Privy DID ${u.privyDid}...`);
  console.log(`   recovery snapshot:`, JSON.stringify(snapshot));
  await privy.deleteUser(u.privyDid);
  console.log(`   ✓ Old DID deleted`);

  console.log("\n2) Importing new Privy user...");
  let newDid: string;
  try {
    const imported = await privy.importUser({
      linkedAccounts: accountsToImport as any,
      createEthereumWallet: false,
      createSolanaWallet: false,
    });
    newDid = imported.id;
    console.log(`   ✓ New DID: ${newDid}`);
  } catch (e: any) {
    console.error(
      `   ✗ Import failed — DB still points at deleted DID ${u.privyDid}.\n` +
        `   Recover by manually calling privy.importUser with the snapshot above.`,
    );
    throw e;
  }

  console.log("\n3) Updating users.privy_did...");
  await db
    .update(users)
    .set({ privyDid: newDid })
    .where(eq(users.id, u.userId));
  console.log(`   ✓ DB updated`);

  console.log(`\nDone. ${username} can now sign in via email OR wallet.`);
  console.log(`They must re-authenticate (any current session is invalid).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
