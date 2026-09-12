/**
 * Admin member email export for newsletters.
 *
 * GET /api/admin/member-emails           → JSON
 * GET /api/admin/member-emails?format=csv → CSV download
 *
 * Includes every member with a non-empty email on file (not just paid /
 * good-standing). Admin-gated. A Bearer token is also accepted when
 * MEMBER_EMAIL_EXPORT_TOKEN is set in the environment (ops break-glass).
 */
import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@core/database";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/app/_lib/auth";

interface MemberEmailRow {
  first_name: string | null;
  last_name: string | null;
  email: string;
  username: string | null;
  status: string;
  onboarding_status: string;
  membership_type: string;
  tier: string | null;
  subscription_status: string | null;
  joined_at: string | null;
}

function bearerMatches(request: Request): boolean {
  const expected = process.env.MEMBER_EMAIL_EXPORT_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!presented) return false;
  const left = createHash("sha256").update(presented).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

async function authorize(request: Request) {
  if (bearerMatches(request)) return;
  await requireAdmin();
}

async function fetchMemberEmails(): Promise<MemberEmailRow[]> {
  const r = await db.execute(sql`
    SELECT
      m.first_name,
      m.last_name,
      m.email,
      u.username,
      m.status,
      m.onboarding_status,
      m.membership_type,
      mt.display_name AS tier,
      s.status        AS subscription_status,
      m.joined_at
    FROM members m
    JOIN users u ON u.id = m.user_id
    LEFT JOIN membership_tiers mt ON mt.id = m.current_tier_id
    LEFT JOIN LATERAL (
      SELECT status
      FROM subscriptions
      WHERE member_id = m.id
      ORDER BY (status = 'active') DESC, current_period_end DESC NULLS LAST
      LIMIT 1
    ) s ON TRUE
    WHERE m.email IS NOT NULL
      AND length(trim(m.email)) > 0
    ORDER BY lower(m.email), m.joined_at
  `);
  return ((r as any).rows ?? r) as MemberEmailRow[];
}

function toCsv(rows: MemberEmailRow[]): string {
  const headers = [
    "first_name",
    "last_name",
    "email",
    "username",
    "status",
    "onboarding_status",
    "membership_type",
    "tier",
    "subscription_status",
    "joined_at",
  ] as const;
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => esc(row[h])).join(",")),
  ].join("\n");
}

export async function GET(request: Request) {
  await authorize(request);
  const url = new URL(request.url);
  const format = url.searchParams.get("format")?.toLowerCase();
  const rows = await fetchMemberEmails();

  if (format === "csv") {
    const csv = toCsv(rows);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fwtx-dao-member-emails-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({
    count: rows.length,
    uniqueEmails: new Set(rows.map((r) => r.email.trim().toLowerCase())).size,
    generatedAt: new Date().toISOString(),
    members: rows,
  });
}
