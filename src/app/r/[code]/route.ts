import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, referralCodes } from "@core/database";
import {
  REFERRAL_COOKIE,
  normalizeReferralCode,
  referralLandingUrl,
} from "@utils/referrals";

/** Keep attribution through Privy/OAuth redirects without putting PII in the URL. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const code = normalizeReferralCode((await params).code);
  if (!code) return new NextResponse("Invitation not found", { status: 404 });
  const [row] = await db
    .select({ code: referralCodes.code })
    .from(referralCodes)
    .where(eq(referralCodes.code, code));
  if (!row) return new NextResponse("Invitation not found", { status: 404 });
  const destination = referralLandingUrl(
    request.url,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NODE_ENV === "production",
  );
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "private, no-store");
  response.cookies.set(REFERRAL_COOKIE, code, {
    httpOnly: true,
    secure: destination.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
