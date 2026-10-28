/**
 * Admin talent export.
 *
 * GET /api/admin/talent/export?search=&status=&interests=&preferences=&sort=&dir=
 *   → CSV of every talent.profiles row matching the admin table's filters,
 *     in the table's sort order.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/_lib/auth";
import { talentService, type TalentProfile } from "@services/talent";
import { talentQueryFromSearchParams } from "@services/talent/services/talent-query";
import { toCsv, type CsvColumn } from "@utils/csv";

const COLUMNS: CsvColumn<TalentProfile>[] = [
  { header: "id", value: (p) => p.id },
  { header: "submitted_at", value: (p) => p.createdAt },
  { header: "updated_at", value: (p) => p.updatedAt },
  { header: "status", value: (p) => p.status },
  { header: "full_name", value: (p) => p.fullName },
  { header: "email", value: (p) => p.email },
  { header: "phone", value: (p) => p.phone },
  { header: "location", value: (p) => p.location },
  { header: "current_work", value: (p) => p.currentWork },
  { header: "skills", value: (p) => p.skills },
  { header: "opportunity_interests", value: (p) => p.opportunityInterests },
  { header: "work_preferences", value: (p) => p.workPreferences },
  { header: "linkedin_url", value: (p) => p.linkedinUrl },
  { header: "github_url", value: (p) => p.githubUrl },
  { header: "x_url", value: (p) => p.xUrl },
  { header: "instagram_url", value: (p) => p.instagramUrl },
  { header: "portfolio_url", value: (p) => p.portfolioUrl },
  { header: "other_social_urls", value: (p) => p.otherSocialUrls },
  { header: "what_do_you_want_to_build", value: (p) => p.whatDoYouWantToBuild },
  {
    header: "where_do_you_see_yourself_in_25_years",
    value: (p) => p.vision25Years,
  },
  { header: "anything_else", value: (p) => p.anythingElse },
  { header: "consented_at", value: (p) => p.consentedAt },
  { header: "source", value: (p) => p.source },
];

export async function GET(request: Request) {
  await requireAdmin();
  const query = talentQueryFromSearchParams(new URL(request.url).searchParams);
  const rows = await talentService.exportProfiles(query);
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(toCsv(COLUMNS, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fwtx-talent-${stamp}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
