/**
 * Admin census export.
 *
 * GET /api/admin/census         → JSON
 * GET /api/admin/census?format=csv → CSV download
 *
 * Definition of "good standing" (matches the SQL the team queries in psql):
 *   active subscription on a paid tier (price_cents > 0)
 *   + member.status = 'active'
 *   + users.wallet_address IS NOT NULL
 *
 * Admin-gated. Use this for monthly voting roster snapshots.
 */
import { NextResponse } from "next/server";
import { db } from "@core/database";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/app/_lib/auth";

interface CensusRow {
  user_id: string;
  username: string | null;
  privy_did: string;
  wallet_address: string | null;
  wallet_verified: boolean;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  tier: string | null;
  price_cents: number;
  billing_interval: string | null;
  contribution_points: number;
  voting_power: number;
  roles: string | null;
  current_period_end: string | null;
}

async function fetchCensus(): Promise<CensusRow[]> {
  const r = await db.execute(sql`
    SELECT
      u.id                       AS user_id,
      u.username,
      u.privy_did,
      lower(u.wallet_address)    AS wallet_address,
      (u.wallet_verified_at IS NOT NULL) AS wallet_verified,
      m.first_name, m.last_name, m.email,
      mt.display_name            AS tier,
      mt.price_cents,
      mt.billing_interval,
      m.contribution_points,
      m.voting_power,
      string_agg(DISTINCT r.display_name, ', ' ORDER BY r.display_name) AS roles,
      s.current_period_end
    FROM users u
    JOIN members m            ON m.user_id = u.id
    JOIN subscriptions s      ON s.member_id = m.id  AND s.status = 'active'
    JOIN membership_tiers mt  ON mt.id = s.tier_id   AND mt.price_cents > 0
    LEFT JOIN member_roles mr ON mr.member_id = m.id AND mr.is_active = TRUE
    LEFT JOIN roles r         ON r.id = mr.role_id
    WHERE u.wallet_address IS NOT NULL
      AND m.status = 'active'
    GROUP BY u.id, u.username, u.privy_did, u.wallet_address, u.wallet_verified_at,
             m.first_name, m.last_name, m.email,
             mt.display_name, mt.price_cents, mt.billing_interval,
             m.contribution_points, m.voting_power, s.current_period_end
    ORDER BY (u.wallet_verified_at IS NULL),
             mt.price_cents DESC,
             m.contribution_points DESC NULLS LAST
  `);
  return ((r as any).rows ?? r) as CensusRow[];
}

function toCsv(rows: CensusRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => esc((row as any)[h])).join(",")),
  ].join("\n");
}

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const format = url.searchParams.get("format")?.toLowerCase();
  const rows = await fetchCensus();

  if (format === "csv") {
    const csv = toCsv(rows);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fwtx-dao-census-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({
    count: rows.length,
    generatedAt: new Date().toISOString(),
    members: rows,
  });
}
