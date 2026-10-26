export const REFERRAL_COOKIE = "fwtx_referral";
export const REFERRAL_SIGNUP_POINTS = 5;

/** Hosting proxies may expose a deploy hostname in request.url. Keep the cookie on the public app. */
export function referralLandingUrl(
  requestUrl: string,
  configuredAppUrl: string | undefined,
  production: boolean,
): URL {
  return new URL(
    "/",
    configuredAppUrl || (production ? "https://dao.fwtx.city" : requestUrl),
  );
}

export function normalizeReferralCode(value: string): string | null {
  const code = value.trim().toUpperCase();
  return /^[A-F0-9]{32}$/.test(code) ? code : null;
}

/** A full month earns 10 points; a full year earns 120. Discounts scale proportionally. */
export function membershipReferralPoints(
  amountCents: number,
  feeCents: number,
  interval: string,
): number {
  if (
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0 ||
    !Number.isSafeInteger(feeCents) ||
    feeCents <= 0
  )
    return 0;
  const base = interval === "year" ? 120 : interval === "month" ? 10 : 0;
  return Math.floor((base * Math.min(amountCents, feeCents)) / feeCents);
}
