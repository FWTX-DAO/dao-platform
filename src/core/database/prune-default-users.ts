/** Exact-manifest cleanup. Defaults to read-only; Privy and PostgreSQL cannot share a transaction. */
import { createHash } from "node:crypto";
import {
  closeSync,
  fsyncSync,
  openSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { parse } from "dotenv";
import { Client } from "pg";
import { PrivyClient } from "@privy-io/node";
import { databaseConnectionOptions } from "./connection-options";

type Row = Record<string, any>;
type Candidate = {
  account: Row;
  member: Row | null;
  privy: Row;
  blockers: string[];
};
type Entry = {
  userId: string;
  privyDid: string;
  state: "prepared" | "provider_deleted" | "complete";
  account: Row;
  member: Row | null;
  privy: Row;
  updatedAt: string;
};
type Journal = {
  manifestSha256: string;
  appId: string;
  database: Row;
  startedAt: string;
  entries: Entry[];
  completedAt?: string;
  error?: string;
};
type ForeignKey = {
  table_name: string;
  column_name: string;
  parent_table: string;
  key_count: number;
};
const argument = (name: string) =>
  process.argv
    .find((value) => value.startsWith(`--${name}=`))
    ?.slice(name.length + 3);
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
const stableAccounts = (user: Row) =>
  JSON.stringify(
    user.linked_accounts.map((account: Row) => JSON.stringify(account)).sort(),
  );

function saveJournal(path: string, journal: Journal) {
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, JSON.stringify(journal, null, 2) + "\n", {
    mode: 0o600,
  });
  const fd = openSync(temporary, "r");
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(temporary, path);
}

async function main() {
  const reportPath = argument("report");
  if (!reportPath)
    throw new Error(
      "Pass --report with the approved private preflight manifest",
    );
  const source = await Bun.file(reportPath).text();
  const manifestSha256 = digest(source);
  if (argument("sha256") !== manifestSha256)
    throw new Error("Manifest SHA-256 does not match the reviewed report");
  const report = JSON.parse(source);
  const candidates: Candidate[] = report.candidates;
  if (
    !candidates.length ||
    candidates.length !== Number(argument("expected-count"))
  )
    throw new Error("Explicit expected count does not match manifest");
  if (
    new Set(candidates.map((row) => row.account.id)).size !==
      candidates.length ||
    new Set(candidates.map((row) => row.account.privy_did)).size !==
      candidates.length
  )
    throw new Error("Manifest contains duplicate identities");
  if (
    candidates.some(
      (row) =>
        row.blockers.length ||
        !row.privy ||
        row.privy.id !== row.account.privy_did ||
        !/^user_[a-z0-9]{8}$/i.test(row.account.username),
    )
  )
    throw new Error("Manifest contains unreviewed or nondefault identities");
  const apply = process.argv.includes("--apply");
  if (apply && !process.argv.includes("--confirm-wallet-disassociation"))
    throw new Error("Apply requires explicit wallet-disassociation approval");
  const env = parse(
    await Bun.file(argument("env") ?? ".env.production.local").text(),
  );
  if (
    !env.DATABASE_URL ||
    !env.NEXT_PUBLIC_PRIVY_APP_ID ||
    !env.PRIVY_APP_SECRET
  )
    throw new Error("Missing operations credentials");
  const url = new URL(env.DATABASE_URL);
  if (
    url.hostname !== report.database.host ||
    (url.port || "5432") !== report.database.port ||
    url.pathname.slice(1) !== report.database.database ||
    env.NEXT_PUBLIC_PRIVY_APP_ID !== report.privyApp.id
  )
    throw new Error("Database or Privy target differs from approved manifest");
  const privy = new PrivyClient({
    appId: env.NEXT_PUBLIC_PRIVY_APP_ID,
    appSecret: env.PRIVY_APP_SECRET,
    timeout: 15_000,
    maxRetries: 0,
  });
  const app = await privy.apps().get(env.NEXT_PUBLIC_PRIVY_APP_ID);
  if (
    app.id !== report.privyApp.id ||
    !app.allowed_domains.includes("https://dao.fwtx.city")
  )
    throw new Error("Privy app identity check failed");
  const journalPath = resolve(
    argument("resume") ?? `${reportPath}.deletions-${Date.now()}.json`,
  );
  const journal: Journal = argument("resume")
    ? await Bun.file(journalPath).json()
    : {
        manifestSha256,
        appId: app.id,
        database: report.database,
        startedAt: new Date().toISOString(),
        entries: [],
      };
  if (journal.manifestSha256 !== manifestSha256 || journal.appId !== app.id)
    throw new Error("Resume journal belongs to another manifest");
  const client = new Client({
    ...databaseConnectionOptions(env.DATABASE_URL),
    connectionTimeoutMillis: 10_000,
    options:
      "-c statement_timeout=15000 -c lock_timeout=5000 -c idle_in_transaction_session_timeout=60000",
  });
  await client.connect();
  try {
    const foreignKeys: ForeignKey[] = (
      await client.query(`SELECT child.relname AS table_name, a.attname AS column_name, parent.relname AS parent_table, cardinality(c.conkey) AS key_count
      FROM pg_constraint c JOIN pg_class child ON child.oid=c.conrelid JOIN pg_namespace ns ON ns.oid=child.relnamespace
      JOIN pg_class parent ON parent.oid=c.confrelid JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
      WHERE c.contype='f' AND parent.relname IN ('users','members') AND ns.nspname='public'`)
    ).rows;
    if (foreignKeys.some((fk) => fk.key_count !== 1))
      throw new Error("Composite identity dependency requires manual review");

    async function inspect(candidate: Candidate, lock: boolean) {
      const entry = journal.entries.find(
        (item) => item.userId === candidate.account.id,
      );
      const account = (
        await client.query(
          `SELECT * FROM users WHERE id=$1${lock ? " FOR UPDATE" : ""}`,
          [candidate.account.id],
        )
      ).rows[0];
      if (!account) {
        if (!argument("resume") || !entry)
          throw new Error("An approved database identity is missing");
        try {
          await privy.users()._get(candidate.account.privy_did);
          throw new Error("Missing database identity still exists at Privy");
        } catch (error) {
          if ((error as { status?: number }).status !== 404) throw error;
        }
        return null;
      }
      if (
        account.privy_did !== candidate.account.privy_did ||
        account.username !== candidate.account.username
      )
        throw new Error("Approved identity or username changed");
      if (
        ["bio", "avatar_url", "wallet_address"].some(
          (key) => account[key] !== candidate.account[key],
        )
      )
        throw new Error("Approved account profile changed");
      const member =
        (
          await client.query(
            `SELECT * FROM members WHERE user_id=$1${lock ? " FOR UPDATE" : ""}`,
            [account.id],
          )
        ).rows[0] ?? null;
      if ((member?.id ?? null) !== (candidate.member?.id ?? null))
        throw new Error("Member identity changed");
      if (
        member &&
        (member.onboarding_status === "completed" ||
          member.terms_accepted_at ||
          member.stripe_customer_id ||
          member.current_tier_id ||
          member.contribution_points ||
          member.first_name ||
          member.last_name ||
          member.email ||
          member.phone ||
          member.profile_completeness)
      )
        throw new Error("Member has new profile, billing or contribution data");
      const parameters: string[] = [];
      const checks = foreignKeys.flatMap((fk) => {
        if (
          (fk.table_name === "members" || fk.table_name === "referral_codes") &&
          fk.column_name === "user_id"
        )
          return [];
        const parentId = fk.parent_table === "users" ? account.id : member?.id;
        if (!parentId) return [];
        parameters.push(fk.table_name, parentId);
        return [
          `SELECT $${parameters.length - 1}::text AS table_name WHERE EXISTS (SELECT 1 FROM public.${quote(fk.table_name)} WHERE ${quote(fk.column_name)}=$${parameters.length})`,
        ];
      });
      if (
        checks.length &&
        (await client.query(checks.join(" UNION ALL "), parameters)).rowCount
      )
        throw new Error("New dependent records require review");
      let provider: Row | null = null;
      try {
        provider = await privy.users()._get(account.privy_did);
      } catch (error) {
        if (
          (error as { status?: number }).status !== 404 ||
          !argument("resume") ||
          !entry
        )
          throw error;
      }
      if (
        provider &&
        (provider.id !== candidate.privy.id ||
          provider.created_at !== candidate.privy.created_at ||
          stableAccounts(provider) !== stableAccounts(candidate.privy))
      )
        throw new Error("Privy linked identity or wallet data changed");
      return { account, member, provider };
    }

    // Check every candidate before the first irreversible action.
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    for (const candidate of candidates) await inspect(candidate, false);
    await client.query("ROLLBACK");
    if (!apply) {
      console.log(
        JSON.stringify({
          mode: "read-only",
          candidates: candidates.length,
          manifestSha256,
          allCurrentChecksPassed: true,
          mutations: 0,
        }),
      );
      return;
    }
    saveJournal(journalPath, journal);
    for (const candidate of candidates) {
      await client.query("BEGIN");
      try {
        const current = await inspect(candidate, true);
        let entry = journal.entries.find(
          (item) => item.userId === candidate.account.id,
        );
        if (!current) {
          if (entry) entry.state = "complete";
          await client.query("COMMIT");
          saveJournal(journalPath, journal);
          continue;
        }
        if (!entry) {
          entry = {
            userId: current.account.id,
            privyDid: current.account.privy_did,
            state: "prepared",
            account: current.account,
            member: current.member,
            privy: current.provider!,
            updatedAt: new Date().toISOString(),
          };
          journal.entries.push(entry);
        }
        saveJournal(journalPath, journal);
        if (current.provider) await privy.users().delete(entry.privyDid);
        entry.state = "provider_deleted";
        entry.updatedAt = new Date().toISOString();
        saveJournal(journalPath, journal);
        if (
          foreignKeys.some(
            (fk) =>
              fk.table_name === "referral_codes" &&
              fk.column_name === "user_id",
          )
        )
          await client.query("DELETE FROM referral_codes WHERE user_id=$1", [
            entry.userId,
          ]);
        if (current.member) {
          const deleted = await client.query(
            "DELETE FROM members WHERE id=$1 AND user_id=$2",
            [current.member.id, entry.userId],
          );
          if (deleted.rowCount !== 1)
            throw new Error("Member deletion count mismatch");
        }
        const deleted = await client.query(
          "DELETE FROM users WHERE id=$1 AND privy_did=$2 AND username=$3",
          [entry.userId, entry.privyDid, candidate.account.username],
        );
        if (deleted.rowCount !== 1)
          throw new Error("User deletion count mismatch");
        await client.query("COMMIT");
        entry.state = "complete";
        entry.updatedAt = new Date().toISOString();
        saveJournal(journalPath, journal);
        console.log(
          `Completed ${journal.entries.filter((item) => item.state === "complete").length}/${candidates.length}`,
        );
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
    const remaining = await client.query(
      "SELECT count(*)::int AS count FROM users WHERE id=ANY($1::text[]) OR privy_did=ANY($2::text[])",
      [
        candidates.map((row) => row.account.id),
        candidates.map((row) => row.account.privy_did),
      ],
    );
    if (remaining.rows[0].count)
      throw new Error("Deleted identity reappeared in database");
    for (const candidate of candidates) {
      try {
        await privy.users()._get(candidate.account.privy_did);
        throw new Error("Deleted identity remains in Privy");
      } catch (error) {
        if ((error as { status?: number }).status !== 404) throw error;
      }
    }
    journal.completedAt = new Date().toISOString();
    delete journal.error;
    saveJournal(journalPath, journal);
    console.log(
      JSON.stringify({
        mode: "applied",
        deletedUsers: candidates.length,
        deletedMembers: candidates.filter((row) => row.member).length,
        remainingApprovedIdentities: 0,
        privyDeletionsVerified: candidates.length,
        journalPath,
      }),
    );
  } catch (error) {
    if (apply) {
      journal.error = String(
        (error as { code?: string; status?: number }).code ??
          (error as { status?: number }).status ??
          "cleanup stopped; inspect state before resuming",
      );
      saveJournal(journalPath, journal);
      console.error("Cleanup journal:", journalPath);
    }
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const value = error as { code?: string; status?: number; message?: string };
  console.error(
    "Cleanup stopped:",
    value.code ??
      value.status ??
      value.message?.replace(/postgres(?:ql)?:\/\/[^\s]+/g, "[redacted]") ??
      "unknown error",
  );
  process.exitCode = 1;
});
