# PostgreSQL setup and operations

The platform uses PlanetScale PostgreSQL, `pg`, and Drizzle. Run project tooling with Bun 1.4.4. The schema is `src/core/database/schema.ts`; migrations are in `src/core/database/migrations`.

## Local development

Put a **development** `DATABASE_URL` and development Privy credentials in the ignored `.env.local`. Bun loads this file automatically. If it currently contains production credentials, do not start development servers, seeds, or database tests without explicitly replacing those variables with isolated fixtures.

```sh
bun install
bun --bun drizzle-kit generate
bun src/core/database/migrate.ts
bun run dev
```

`db:push`, seeds, and Drizzle Studio are development tools; do not point them at production. New databases can use the normal migration runner. Existing production databases require their migration history to agree with their schema before that runner is safe.

For PlanetScale URLs containing `sslmode=verify-full&sslrootcert=system`, `databaseConnectionOptions` removes the `system` pseudo-filename for `pg`. Certificate verification stays enabled. Do not disable certificate checks.

## Production operations

Use a separate ignored operations environment file with `DATABASE_URL`, `NEXT_PUBLIC_PRIVY_APP_ID`, and `PRIVY_APP_SECRET`. The operations commands parse the explicitly supplied file; they never print its secrets.

```sh
# Read-only inventory of database, provider, dependencies, and migration history.
bun run db:preflight .env.production.local

# Read-only plan for the verified-email/referral release.
bun run db:referral-migration --env=.env.production.local
```

Reports are private files under ignored `tmp/production-preflight/`. They include account and wallet data and must not be committed or published.

The 2026-10-26 production audit found all 280 baseline columns from migration `0002`, but an empty `drizzle.__drizzle_migrations` table. **Do not run the generic `db:migrate` or `db:push` against that database.** The targeted referral migration runner applies only `0003` and `0004` in one transaction, verifies the backfill, and leaves the existing migration journal unchanged. It requires a reviewed SQL hash and target fingerprint for apply. Baseline journal reconciliation is separate work; the ordinary migrator remains unsuitable until then.

See [the release runbook](./VERIFIED_EMAIL_REFERRALS.md) for deployment order, cleanup safeguards, and validation.

## Identity rules

- The Privy DID is the identity key. Never merge or reassign identities based on an email supplied by a client.
- Initial database identities have a null username. The entire `user_` prefix is reserved, case-insensitively, including manually chosen variants.
- Privy verifies email ownership first. Profile completion, verified email, terms, initial role, and referral attribution then commit in one PostgreSQL transaction.
- Optional wallet synchronization uses a savepoint so a wallet conflict cannot roll back a completed profile.
- Completed profiles require a nonblank email in the database. Server guards also require that email to match the current verified Privy identity.

## Validation

The integration suite only accepts `DAO_TEST_DATABASE_URL` targeting `127.0.0.1:55433/dao_referral_test`; it truncates synthetic fixtures there. It refuses other hosts, ports, or database names. Run migrations on that isolated database before the tests. Ordinary `bun test` skips database integration tests when this variable is absent.

```sh
bun run lint
bun run build
bun test
```
