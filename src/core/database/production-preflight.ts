/** Read-only production inventory. Does not import the application DB or perform mutations. */
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { parse } from "dotenv";
import { Client } from "pg";
import { PrivyClient } from "@privy-io/node";
import { getVerifiedEmail } from "../../shared/utils/verified-email";
import { databaseConnectionOptions } from "./connection-options";

const quote = (name: string) => `"${name.replaceAll('"', '""')}"`;

async function main() {
  const path = process.argv[2] ?? ".env.production.local";
  const env = parse(await Bun.file(path).text());
  for (const key of [
    "DATABASE_URL",
    "NEXT_PUBLIC_PRIVY_APP_ID",
    "PRIVY_APP_SECRET",
  ]) {
    if (!env[key] || env[key]!.startsWith("<") || env[key]!.startsWith("***"))
      throw new Error(`Missing ${key} in operations environment file`);
  }
  const url = new URL(env.DATABASE_URL!);
  const privy = new PrivyClient({
    appId: env.NEXT_PUBLIC_PRIVY_APP_ID!,
    appSecret: env.PRIVY_APP_SECRET!,
    timeout: 15_000,
  });
  const app = await privy.apps().get(env.NEXT_PUBLIC_PRIVY_APP_ID!);
  if (!app.allowed_domains.includes("https://dao.fwtx.city"))
    throw new Error("Privy app does not allow the production DAO origin");
  const providerUsers = [];
  for await (const user of privy.users().list()) providerUsers.push(user);
  const byDid = new Map(providerUsers.map((user) => [user.id, user]));
  const client = new Client({
    ...databaseConnectionOptions(env.DATABASE_URL!),
    connectionTimeoutMillis: 10_000,
    options: "-c default_transaction_read_only=on -c statement_timeout=15000",
  });
  await client.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const identity = (
      await client.query(
        "SELECT current_database() AS database, current_setting('server_version') AS version, current_setting('transaction_read_only') AS read_only",
      )
    ).rows[0];
    if (identity.read_only !== "on")
      throw new Error("Read-only transaction was not established");
    const rows = (
      await client.query(
        "SELECT to_jsonb(u) AS account, to_jsonb(m) AS member FROM users u LEFT JOIN members m ON m.user_id = u.id ORDER BY u.created_at",
      )
    ).rows;
    const candidates = rows.filter((row) =>
      /^user_[a-z0-9]{8}$/i.test(row.account.username ?? ""),
    );
    const userIds = candidates.map((row) => row.account.id);
    const memberIds = candidates
      .filter((row) => row.member)
      .map((row) => row.member.id);
    const foreignKeys = (
      await client.query(`SELECT c.conname, ns.nspname AS schema, child.relname AS table_name, a.attname AS column_name, parent.relname AS parent_table
      FROM pg_constraint c JOIN pg_class child ON child.oid=c.conrelid JOIN pg_namespace ns ON ns.oid=child.relnamespace
      JOIN pg_class parent ON parent.oid=c.confrelid JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
      WHERE c.contype='f' AND parent.relname IN ('users','members') AND ns.nspname='public' AND cardinality(c.conkey)=1`)
    ).rows;
    const dependencies = new Map<string, Record<string, number>>();
    for (const fk of foreignKeys) {
      const ids = fk.parent_table === "users" ? userIds : memberIds;
      if (!ids.length) continue;
      const counts = await client.query(
        `SELECT ${quote(fk.column_name)} AS id, count(*)::int AS count FROM ${quote(fk.schema)}.${quote(fk.table_name)} WHERE ${quote(fk.column_name)} = ANY($1::text[]) GROUP BY ${quote(fk.column_name)}`,
        [ids],
      );
      for (const row of counts.rows) {
        const deps = dependencies.get(row.id) ?? {};
        deps[`${fk.table_name}.${fk.column_name}`] = row.count;
        dependencies.set(row.id, deps);
      }
    }
    const candidateDetails = candidates.map((row) => {
      const provider = byDid.get(row.account.privy_did);
      const deps = {
        ...dependencies.get(row.account.id),
        ...dependencies.get(row.member?.id),
      };
      const blockers: string[] = [];
      if (
        row.member?.onboarding_status === "completed" ||
        row.member?.terms_accepted_at
      )
        blockers.push("completed onboarding or accepted terms");
      if (
        row.member?.stripe_customer_id ||
        row.member?.current_tier_id ||
        deps["subscriptions.member_id"]
      )
        blockers.push("billing/customer/tier history requires review");
      if (row.member?.contribution_points)
        blockers.push("earned contribution points");
      const meaningfulDeps = Object.entries(deps).filter(
        ([key, count]) =>
          count &&
          ![
            "members.user_id",
            "referral_codes.user_id",
            "member_roles.member_id",
          ].includes(key),
      );
      if (meaningfulDeps.length)
        blockers.push("dependent content or activity records");
      const embeddedWallets =
        provider?.linked_accounts.filter(
          (account) =>
            account.type === "wallet" &&
            "wallet_client_type" in account &&
            account.wallet_client_type === "privy",
        ) ?? [];
      return {
        ...row,
        privy: provider ?? null,
        verifiedEmail: getVerifiedEmail(provider?.linked_accounts),
        dependencies: deps,
        blockers,
        embeddedWalletCount: embeddedWallets.length,
        walletBalancesAssessed: false,
      };
    });
    const summary = {
      dbUsers: rows.length,
      privyUsers: providerUsers.length,
      defaultUsernameCandidates: candidates.length,
      candidatesWithReviewFlags: candidateDetails.filter(
        (row) => row.blockers.length,
      ).length,
      candidateEmbeddedWallets: candidateDetails.reduce(
        (sum, row) => sum + row.embeddedWalletCount,
        0,
      ),
      missingUsernames: rows.filter((row) => !row.account.username).length,
      otherUserPrefixNames: rows.filter(
        (row) =>
          /^user_/i.test(row.account.username ?? "") &&
          !/^user_[a-z0-9]{8}$/i.test(row.account.username ?? ""),
      ).length,
      completedMembersWithoutEmail: rows.filter(
        (row) =>
          row.member?.onboarding_status === "completed" &&
          !row.member.email?.trim(),
      ).length,
      completedMembersWithoutProviderEmail: rows.filter(
        (row) =>
          row.member?.onboarding_status === "completed" &&
          !getVerifiedEmail(byDid.get(row.account.privy_did)?.linked_accounts),
      ).length,
    };
    const tiers = (
      await client.query(
        "SELECT name, price_cents, billing_interval, is_active FROM membership_tiers ORDER BY sort_order",
      )
    ).rows;
    const columns = (
      await client.query(
        "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position",
      )
    ).rows;
    const journalTable = (
      await client.query(
        "SELECT to_regclass('drizzle.__drizzle_migrations')::text AS table_name",
      )
    ).rows[0]?.table_name;
    const migrationJournal = journalTable
      ? (
          await client.query(
            "SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id",
          )
        ).rows
      : [];
    const report = {
      generatedAt: new Date().toISOString(),
      mode: "read-only",
      environmentFile: path,
      database: { host: url.hostname, port: url.port || "5432", ...identity },
      privyApp: {
        id: app.id,
        name: app.name,
        allowedDomains: app.allowed_domains,
        emailAuth: app.email_auth,
        googleOAuth: app.google_oauth,
        appleOAuth: app.apple_oauth,
      },
      summary,
      tiers,
      columns,
      migrationJournal: { present: !!journalTable, entries: migrationJournal },
      candidates: candidateDetails,
      deletionExecuted: false,
      note: "Privy deletion is irreversible and disassociates embedded wallets. Review exact identities, dependent rows, billing, and wallet assets before approving a deletion manifest. This command has no apply mode.",
    };
    await client.query("ROLLBACK");
    const directory = resolve("tmp/production-preflight");
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const file = resolve(
      directory,
      `${new Date().toISOString().replaceAll(":", "-")}.json`,
    );
    const content = JSON.stringify(report, null, 2) + "\n";
    writeFileSync(file, content, { flag: "wx", mode: 0o600 });
    console.log(
      JSON.stringify(
        {
          file,
          sha256: createHash("sha256").update(content).digest("hex"),
          database: report.database,
          privyApp: report.privyApp,
          summary,
          tiers,
          migrationJournal: report.migrationJournal,
          mutations: 0,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  // Do not print driver/provider request objects, which can contain credentials.
  const value = error as {
    code?: string;
    status?: number;
    message?: string;
    syscall?: string;
    path?: string;
  };
  console.error(
    "Production preflight failed:",
    value.code ?? value.status ?? "configuration/provider error",
    value.syscall ?? "",
    value.code === "ENOENT" ? value.path : "",
  );
  process.exitCode = 1;
});
