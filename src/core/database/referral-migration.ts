/** Plans one additive migration by default. Never replays the empty production Drizzle journal. */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "dotenv";
import { Client } from "pg";
import { databaseConnectionOptions } from "./connection-options";

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const argument = (name: string) =>
  process.argv
    .find((value) => value.startsWith(`--${name}=`))
    ?.slice(name.length + 3);

async function main() {
  const apply = process.argv.includes("--apply");
  const env = parse(
    await Bun.file(argument("env") ?? ".env.production.local").text(),
  );
  if (!env.DATABASE_URL || env.DATABASE_URL.startsWith("<"))
    throw new Error("Operations DATABASE_URL is missing");
  const url = new URL(env.DATABASE_URL);
  const target = hash(
    `${url.hostname}:${url.port || "5432"}${url.pathname}:${url.username}`,
  );
  const migration = (
    await Promise.all(
      ["0003_verified_email_referrals.sql", "0004_reserved_usernames.sql"].map(
        (file) =>
          Bun.file(new URL(`./migrations/${file}`, import.meta.url)).text(),
      ),
    )
  ).join("\n");
  const sha256 = hash(migration);
  if (
    apply &&
    (argument("sha256") !== sha256 || argument("target") !== target)
  ) {
    throw new Error(
      "Apply requires the exact --sha256 and --target from a reviewed plan",
    );
  }
  const client = new Client({
    ...databaseConnectionOptions(env.DATABASE_URL),
    connectionTimeoutMillis: 10_000,
    options: "-c statement_timeout=30000 -c lock_timeout=5000",
  });
  await client.connect();
  try {
    await client.query(apply ? "BEGIN" : "BEGIN READ ONLY");
    if (apply)
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtext('dao-verified-email-referrals-migration'))",
      );
    const columns = (
      await client.query(
        "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public'",
      )
    ).rows;
    const actual = new Set(
      columns.map((row) => `${row.table_name}.${row.column_name}`),
    );
    const baseline = await Bun.file(
      new URL("./migrations/meta/0002_snapshot.json", import.meta.url),
    ).json();
    const expected = Object.values(
      baseline.tables as Record<
        string,
        { name: string; columns: Record<string, { name: string }> }
      >,
    ).flatMap((table) =>
      Object.values(table.columns).map(
        (column) => `${table.name}.${column.name}`,
      ),
    );
    const missing = expected.filter((column) => !actual.has(column));
    if (missing.length)
      throw new Error(`Missing baseline columns: ${missing.join(", ")}`);
    if (
      columns.some((row) =>
        ["referral_codes", "referrals", "referral_rewards"].includes(
          row.table_name,
        ),
      ) ||
      actual.has("members.email_verified_at") ||
      actual.has("payment_history.stripe_invoice_id")
    ) {
      throw new Error(
        "Feature objects already exist; reconcile applied or partial migration before proceeding",
      );
    }
    const counts = (
      await client.query(
        "SELECT (SELECT count(*)::int FROM users) AS users, (SELECT count(*)::int FROM users WHERE btrim(username) ~* '^user_') AS reserved_usernames, (SELECT count(*)::int FROM members WHERE onboarding_status='completed' AND (email IS NULL OR length(btrim(email))=0)) AS profiles_requiring_email",
      )
    ).rows[0];
    if (counts.reserved_usernames)
      throw new Error(
        "Reserved user_ names remain; complete the approved account cleanup before this migration",
      );
    const directory = resolve("tmp/production-preflight");
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const artifact = resolve(
      directory,
      `referral-migration-${sha256.slice(0, 12)}.sql`,
    );
    writeFileSync(
      artifact,
      `BEGIN;\nSET LOCAL lock_timeout = '5s';\nSET LOCAL statement_timeout = '30s';\n${migration}\nCOMMIT;\n`,
      { mode: 0o600 },
    );
    if (apply) {
      await client.query(migration);
      const result = (
        await client.query(
          "SELECT (SELECT count(*) FROM users) = (SELECT count(*) FROM referral_codes) AS all_users_have_codes",
        )
      ).rows[0];
      if (!result?.all_users_have_codes)
        throw new Error("Referral code backfill verification failed");
      await client.query("COMMIT");
    } else {
      await client.query("ROLLBACK");
    }
    console.log(
      JSON.stringify(
        {
          mode: apply ? "applied" : "read-only plan",
          host: url.hostname,
          database: url.pathname.slice(1),
          target,
          sha256,
          artifact,
          counts,
          baselineColumnsVerified: expected.length,
          migrationJournalChanged: false,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const value = error as { code?: string; message?: string };
  console.error(
    "Referral migration stopped:",
    value.code ??
      value.message?.replace(
        /postgres(?:ql)?:\/\/[^\s]+/g,
        "[connection redacted]",
      ) ??
      "unknown error",
  );
  process.exitCode = 1;
});
