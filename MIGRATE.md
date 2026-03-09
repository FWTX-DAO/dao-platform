# Data Migration: Turso (SQLite) → PlanetScale (PostgreSQL)

## Status

- **Source**: `fwtx-dao` Turso DB (`libsql://fwtx-dao-tobalo.aws-us-east-1.turso.io`)
- **Target**: PlanetScale PostgreSQL (Drizzle schema at `src/core/database/schema.ts`)
- **Dump date**: 2026-03-04
- **PG schema**: Already created via `bun run db:push` — all 22 tables exist

## Artifacts

| File | Location | Description |
|------|----------|-------------|
| `fwtx-dao-turso-dump.json` | `/tmp/` | Full JSON dump with SQLite schemas + all row data |
| `fwtx-dao-raw-data.json` | `/tmp/` | Raw row data for all 14 source tables |
| `migrate.sql` | `/tmp/` | Ready-to-run PG migration (370 lines, 50.5 KB) |

## Data Inventory

| Table | Rows | Type Conversions |
|-------|------|------------------|
| users | 29 | timestamps: text → timestamptz |
| members | 23 | timestamps: text → timestamptz, badges/special_roles: text → jsonb |
| forum_posts | 1 | is_pinned/is_locked: int(0/1) → boolean |
| projects | 3 | timestamps: text → timestamptz |
| meeting_notes | 5 | timestamps: text → timestamptz |
| documents | 1 | is_public: int → boolean, keyvalues: text → jsonb |
| document_audit_trail | 1 | metadata: text → jsonb |
| innovation_bounties | 6 | is_anonymous: int → boolean, technical_requirements: text → jsonb, deadline: text → timestamptz |
| forum_votes | 0 | — |
| project_collaborators | 0 | — |
| project_updates | 0 | — |
| document_shares | 0 | — |
| bounty_proposals | 0 | — |
| bounty_comments | 0 | — |

**New PG-only tables** (no SQLite equivalent, need seeding):
`membership_tiers`, `subscriptions`, `payment_history`, `roles`, `permissions`, `role_permissions`, `member_roles`, `member_activities`

---

## Step-by-step Migration

### Prerequisites

- PG schema already pushed (`bun run db:push` completed)
- `.env.local` has both `DATABASE_URL` (PG) and `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`
- Migration file at `/tmp/migrate.sql`

### Step 1: Review the migration SQL

Open and review the file before running:

```bash
less /tmp/migrate.sql
```

Key things to verify:
- Phase 0 deletes existing PG data (2 test users/members from post-migration testing)
- Phases 1-8 insert all Turso data with type conversions
- Phase 10 seeds RBAC (tiers, roles, permissions, role-permissions)
- Phase 11 assigns admin role to `tobalo-web3` user
- Phase 12 sets all members to `tier_free`

### Step 2: Edit migrate.sql — Remove RBAC seeding (Phase 10)

**Important**: The migration SQL includes inline RBAC seeding (Phase 10) that conflicts with
the canonical `seed-rbac.ts` script. The seed script has the correct values:
- Tiers: Free ($0/lifetime), Pro ($5/mo), Annual ($49/yr)
- Roles: admin, moderator, member, guest (not "viewer")
- Permissions: 7 resources x 5 actions = 35 (not 17)

**Delete everything between these comments in `/tmp/migrate.sql`:**
```
-- Phase 10: Seed RBAC + Membership Tiers
...through...
-- Phase 11: Assign admin role
```

Keep Phase 11 (admin assignment) and Phase 12 (free tier update) — but they will need
to be run AFTER `db:seed-rbac` since they reference the seeded IDs. See Step 4.

**Or** — simpler approach: delete Phases 10-12 entirely from `migrate.sql` and handle
RBAC + admin assignment separately in Steps 4-5.

### Step 3: Run the data migration

```bash
# Load DATABASE_URL from .env.local and pipe migrate.sql to psql
npx dotenv -e .env.local -- node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } });
const sql = fs.readFileSync('/tmp/migrate.sql', 'utf8');
pool.query(sql)
  .then(() => { console.log('Migration complete'); pool.end(); })
  .catch(e => { console.error('Migration failed:', e.message); pool.end(); process.exit(1); });
"
```

If the `BEGIN/COMMIT` transaction wrapper causes issues with the node-postgres driver,
split into individual statements:

```bash
npx dotenv -e .env.local -- node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } });
const sql = fs.readFileSync('/tmp/migrate.sql', 'utf8');
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const stmt of statements) {
      if (stmt === 'BEGIN' || stmt === 'COMMIT') continue;
      await client.query(stmt);
    }
    await client.query('COMMIT');
    console.log('Migration complete (' + statements.length + ' statements)');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', e.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
})();
"
```

### Step 4: Seed RBAC tables

```bash
bun run db:seed-rbac
```

This inserts membership tiers, roles, permissions, and the role-permission matrix using
the canonical values from `src/core/database/seed-rbac.ts`.

### Step 5: Assign admin role + set member tiers

After RBAC seeding, assign admin and link members to the free tier:

```bash
npx dotenv -e .env.local -- node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } });

(async () => {
  const client = await pool.connect();

  // Get the admin role ID and free tier ID from seeded data
  const adminRole = await client.query(\"SELECT id FROM roles WHERE name = 'admin' LIMIT 1\");
  const freeTier = await client.query(\"SELECT id FROM membership_tiers WHERE name = 'free' LIMIT 1\");

  if (!adminRole.rows[0] || !freeTier.rows[0]) {
    console.error('RBAC not seeded yet — run bun run db:seed-rbac first');
    process.exit(1);
  }

  // Find tobalo-web3's member record
  const member = await client.query(
    \"SELECT m.id, m.user_id FROM members m JOIN users u ON m.user_id = u.id WHERE u.username = 'tobalo-web3' LIMIT 1\"
  );

  if (member.rows[0]) {
    // Assign admin role
    const { randomUUID } = require('crypto');
    await client.query(
      'INSERT INTO member_roles (id, member_id, role_id, granted_by, granted_at, is_active, created_at) VALUES (\$1, \$2, \$3, \$4, NOW(), true, NOW()) ON CONFLICT DO NOTHING',
      [randomUUID(), member.rows[0].id, adminRole.rows[0].id, member.rows[0].user_id]
    );
    console.log('Admin role assigned to tobalo-web3');
  }

  // Set all members to free tier
  const updated = await client.query(
    'UPDATE members SET current_tier_id = \$1, onboarding_status = \\'not_started\\', profile_completeness = 0 WHERE current_tier_id IS NULL',
    [freeTier.rows[0].id]
  );
  console.log('Members set to free tier:', updated.rowCount);

  client.release();
  pool.end();
})();
"
```

### Step 6: Verify migration

```bash
npx dotenv -e .env.local -- node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } });
pool.query(\`
  SELECT 'users' as tbl, count(*) as cnt FROM users
  UNION ALL SELECT 'members', count(*) FROM members
  UNION ALL SELECT 'forum_posts', count(*) FROM forum_posts
  UNION ALL SELECT 'projects', count(*) FROM projects
  UNION ALL SELECT 'meeting_notes', count(*) FROM meeting_notes
  UNION ALL SELECT 'documents', count(*) FROM documents
  UNION ALL SELECT 'document_audit_trail', count(*) FROM document_audit_trail
  UNION ALL SELECT 'innovation_bounties', count(*) FROM innovation_bounties
  UNION ALL SELECT 'membership_tiers', count(*) FROM membership_tiers
  UNION ALL SELECT 'roles', count(*) FROM roles
  UNION ALL SELECT 'permissions', count(*) FROM permissions
  UNION ALL SELECT 'role_permissions', count(*) FROM role_permissions
  UNION ALL SELECT 'member_roles', count(*) FROM member_roles
  ORDER BY tbl
\`).then(r => { console.table(r.rows); pool.end(); });
"
```

**Expected counts:**

| Table | Expected |
|-------|----------|
| users | 29 |
| members | 23 |
| forum_posts | 1 |
| projects | 3 |
| meeting_notes | 5 |
| documents | 1 |
| document_audit_trail | 1 |
| innovation_bounties | 6 |
| membership_tiers | 3 |
| roles | 4 |
| permissions | 35 |
| role_permissions | ~95 |
| member_roles | 1 |

### Step 7: Smoke test the app

```bash
bun dev
```

1. Log in with the `tobalo-web3` Privy account
2. Verify forum post "Robert Rules of Order Implementation" appears
3. Verify 3 projects load on the projects page
4. Verify 6 bounties load on the bounties page
5. Verify meeting notes list shows 5 entries
6. Check the member directory shows 23 members

---

## Known Gaps & Follow-ups

### 1. Members need re-onboarding
Old SQLite `members` table had no profile fields. All migrated members have:
- `first_name`, `last_name`, `email`, `phone` = NULL
- `onboarding_status` = `'not_started'`
- `profile_completeness` = 0

They'll hit the onboarding flow on next login.

### 2. Mixed ID formats
Old IDs: `1754238200326-arc8uxbvb` (timestamp-based)
New IDs: `019cb968-1284-7a3d-a2cc-cd74073fabf4` (UUIDv7)

Both are text PKs — no schema issue. New records use UUIDv7 via `generateId()`.

### 3. System user
`public-user-id` with `did:system:public-submissions` is included. Used for anonymous
bounty submissions. Ensure app logic handles this non-Privy DID gracefully.

### 4. Privy DID conflict
Old user `019b37b0...` (Tobalo-Yeetum) has privy_did `did:privy:cmjd5izue00nfl70cxeet1l4i`.
The 2 PG test users are deleted during migration. On next login, Privy will resolve to the
old user ID `019b37b0...` — which now has the correct member record and FK chains.

### 5. No Stripe data
`subscriptions`, `payment_history` tables are empty. Stripe integration was not in the old
SQLite schema. These tables are ready for the Stripe webhook integration.

### 6. technical_requirements is plain text in jsonb
Bounty `technical_requirements` was free-form text in SQLite (e.g. "Knowledge Graphs + VectorDB, LLMs").
It's now stored as a JSON-wrapped string in the jsonb column (e.g. `"Knowledge Graphs + VectorDB, LLMs"`).
Consider normalizing to structured JSON in a future migration if needed.

### 7. Turso decommission
After verifying the migration, the Turso `fwtx-dao` database can be archived or deleted.
The old env vars (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) can be removed from `.env.local`.

```bash
# When ready:
turso db destroy fwtx-dao
```

Remove from `.env.local`:
```
TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...
```

And uninstall the libsql client if no longer needed:
```bash
bun remove @libsql/client
```

---

## Rollback

If anything goes wrong, the migration runs in a transaction (`BEGIN/COMMIT`).
On failure, it rolls back automatically. The PG database returns to its pre-migration state
(2 test users + 2 test members).

To manually rollback after a successful migration:
```sql
-- Nuclear option: drop all data and re-push schema
-- bun run db:push will recreate empty tables
```

Or restore from the dump:
```bash
# Re-run the turso dump extraction if /tmp files were cleaned
npx dotenv -e .env.local -- node /tmp/generate-migrate.js
```
