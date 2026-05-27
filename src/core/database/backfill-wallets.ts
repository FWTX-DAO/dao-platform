/**
 * Backfill wallet addresses from Privy → users table.
 *
 * Iterates every user, calls Privy's server SDK for the authoritative
 * linked-accounts list, picks the preferred ETH wallet (external > embedded),
 * and:
 *   - writes it to users.wallet_address when the DB slot is NULL
 *   - records a "conflict" row when DB and Privy disagree (does NOT overwrite)
 *   - records "no_wallet" / "privy_missing" / "error" rows for the report
 *
 * Run:
 *   bun run db:backfill-wallets             # apply + report
 *   bun run db:backfill-wallets -- --dry    # report only, no writes
 *   bun run db:backfill-wallets -- --csv ./wallets.csv
 */
import { writeFileSync } from "node:fs";
import { PrivyClient } from "@privy-io/server-auth";
import { eq } from "drizzle-orm";
import { db, users } from "./index";
import { getPreferredEthWalletFromAccounts } from "../../shared/utils/wallet";

type Outcome =
  | "backfilled"
  | "already_synced"
  | "conflict"
  | "no_wallet"
  | "privy_missing"
  | "error";

interface Row {
  userId: string;
  privyDid: string;
  username: string | null;
  dbAddress: string | null;
  privyAddress: string | null;
  privyClient: string | null;
  outcome: Outcome;
  note?: string;
}

function parseArgs(argv: string[]) {
  const dry = argv.includes("--dry") || argv.includes("--dry-run");
  const csvIdx = argv.findIndex((a) => a === "--csv");
  const csvPath = csvIdx >= 0 ? argv[csvIdx + 1] : undefined;
  const concIdx = argv.findIndex((a) => a === "--concurrency");
  const concurrency =
    concIdx >= 0 ? Math.max(1, Number(argv[concIdx + 1]) || 8) : 8;
  return { dry, csvPath, concurrency };
}

async function processBatch(
  privy: PrivyClient,
  batch: Array<{
    id: string;
    privyDid: string;
    username: string | null;
    walletAddress: string | null;
  }>,
  dry: boolean,
): Promise<Row[]> {
  return Promise.all(
    batch.map(async (u): Promise<Row> => {
      const base = {
        userId: u.id,
        privyDid: u.privyDid,
        username: u.username,
        dbAddress: u.walletAddress,
      };
      try {
        const privyUser = await privy.getUser(u.privyDid);
        const wallet = getPreferredEthWalletFromAccounts(
          privyUser?.linkedAccounts,
        );

        if (!wallet?.address) {
          return {
            ...base,
            privyAddress: null,
            privyClient: null,
            outcome: "no_wallet",
          };
        }

        const privyAddr = wallet.address.toLowerCase();
        const dbAddr = u.walletAddress?.toLowerCase() ?? null;

        if (dbAddr === privyAddr) {
          return {
            ...base,
            privyAddress: wallet.address,
            privyClient: wallet.walletClientType ?? null,
            outcome: "already_synced",
          };
        }

        if (dbAddr && dbAddr !== privyAddr) {
          return {
            ...base,
            privyAddress: wallet.address,
            privyClient: wallet.walletClientType ?? null,
            outcome: "conflict",
            note: "DB has a different address; not overwriting",
          };
        }

        // dbAddr is null — backfill
        if (!dry) {
          await db
            .update(users)
            .set({ walletAddress: wallet.address, updatedAt: new Date() })
            .where(eq(users.id, u.id));
        }
        return {
          ...base,
          privyAddress: wallet.address,
          privyClient: wallet.walletClientType ?? null,
          outcome: "backfilled",
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const isMissing = /not\s*found|no user|404/i.test(msg);
        return {
          ...base,
          privyAddress: null,
          privyClient: null,
          outcome: isMissing ? "privy_missing" : "error",
          note: msg,
        };
      }
    }),
  );
}

function csvEscape(v: string | null | undefined): string {
  if (v == null) return "";
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

async function main() {
  const { dry, csvPath, concurrency } = parseArgs(process.argv.slice(2));

  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID || !process.env.PRIVY_APP_SECRET) {
    console.error(
      "Missing NEXT_PUBLIC_PRIVY_APP_ID or PRIVY_APP_SECRET in environment.",
    );
    process.exit(1);
  }

  const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    process.env.PRIVY_APP_SECRET,
  );

  console.log(
    `Backfill mode: ${dry ? "DRY RUN (no writes)" : "APPLY"}, concurrency=${concurrency}`,
  );
  console.log(
    `Privy appId: ${process.env.NEXT_PUBLIC_PRIVY_APP_ID}, secret length: ${process.env.PRIVY_APP_SECRET.length}`,
  );

  const allUsers = await db
    .select({
      id: users.id,
      privyDid: users.privyDid,
      username: users.username,
      walletAddress: users.walletAddress,
    })
    .from(users);

  console.log(`Found ${allUsers.length} users.`);

  // Fail-fast: probe Privy with the first user before iterating all 61.
  const probe = allUsers[0];
  if (probe) {
    try {
      await privy.getUser(probe.privyDid);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/invalid app id|app secret|unauthorized/i.test(msg)) {
        console.error(
          `\nPrivy auth failed: "${msg}"\n` +
            `Check that NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET in .env.local\n` +
            `match the same Privy app in your dashboard.`,
        );
        process.exit(1);
      }
      // Other errors (e.g. user not found on Privy side) are fine — let the loop handle them.
    }
  }

  const rows: Row[] = [];
  for (let i = 0; i < allUsers.length; i += concurrency) {
    const batch = allUsers.slice(i, i + concurrency);
    const batchRows = await processBatch(privy, batch, dry);
    rows.push(...batchRows);
    process.stdout.write(
      `\r  processed ${Math.min(i + concurrency, allUsers.length)}/${allUsers.length}`,
    );
  }
  process.stdout.write("\n");

  const summary: Record<Outcome, number> = {
    backfilled: 0,
    already_synced: 0,
    conflict: 0,
    no_wallet: 0,
    privy_missing: 0,
    error: 0,
  };
  for (const r of rows) summary[r.outcome]++;

  console.log("\n=== Summary ===");
  console.table(summary);

  // Always print conflicts and errors inline so they're not buried in the CSV
  const flagged = rows.filter(
    (r) => r.outcome === "conflict" || r.outcome === "error",
  );
  if (flagged.length > 0) {
    console.log(`\n=== ${flagged.length} flagged rows (review) ===`);
    for (const r of flagged) {
      console.log(
        `  [${r.outcome}] ${r.username ?? "(no username)"} (${r.userId}) ` +
          `db=${r.dbAddress ?? "null"} privy=${r.privyAddress ?? "null"}` +
          (r.note ? ` — ${r.note}` : ""),
      );
    }
  }

  if (csvPath) {
    const header = [
      "userId",
      "privyDid",
      "username",
      "dbAddress",
      "privyAddress",
      "privyClient",
      "outcome",
      "note",
    ].join(",");
    const lines = rows.map((r) =>
      [
        r.userId,
        r.privyDid,
        r.username,
        r.dbAddress,
        r.privyAddress,
        r.privyClient,
        r.outcome,
        r.note ?? "",
      ]
        .map(csvEscape)
        .join(","),
    );
    writeFileSync(csvPath, [header, ...lines].join("\n"), "utf8");
    console.log(`\nReport written to ${csvPath}`);
  }

  if (dry) {
    console.log("\nDry run — no DB rows updated.");
  } else {
    console.log(`\nBackfill complete. ${summary.backfilled} rows updated.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
