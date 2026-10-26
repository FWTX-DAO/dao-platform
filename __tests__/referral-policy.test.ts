import { describe, expect, test } from "bun:test";
import type Stripe from "stripe";
import { getVerifiedEmail } from "../src/shared/utils/verified-email";
import {
  hasCompletedOnboarding,
  validateUsernameFormat,
} from "../src/shared/utils/onboarding";
import {
  membershipReferralPoints,
  normalizeReferralCode,
  referralLandingUrl,
} from "../src/shared/utils/referrals";
import { referralInvoiceAmount } from "../src/app/_services/subscriptions/services/referral-invoice";
import { databaseConnectionOptions } from "../src/core/database/connection-options";

describe("verified onboarding identity", () => {
  test("reserves every user_ prefix, including mixed case and nonstandard suffixes", () => {
    for (const name of [
      "user_",
      "user_x",
      "USER_abc",
      " User_someone_else ",
      "user_0199beef",
    ]) {
      expect(validateUsernameFormat(name).valid).toBe(false);
      expect(
        hasCompletedOnboarding(
          name,
          { onboardingStatus: "completed", email: "member@example.com" },
          "member@example.com",
        ),
      ).toBe(false);
    }
    expect(validateUsernameFormat("civic_member").valid).toBe(true);
  });
  test("accepts verified linked emails and normalizes them", () => {
    expect(
      getVerifiedEmail([
        { type: "email", address: " Member@Example.com ", verified_at: 100 },
      ]),
    ).toBe("member@example.com");
    expect(
      getVerifiedEmail([
        {
          type: "email",
          address: "member@example.com",
          verifiedAt: new Date(),
        },
      ]),
    ).toBe("member@example.com");
  });
  test("does not trust unverified imports, wallet accounts, or OAuth without an email", () => {
    expect(
      getVerifiedEmail([
        { type: "email", address: "unverified@example.com", verified_at: 0 },
      ]),
    ).toBeNull();
    expect(
      getVerifiedEmail([
        { type: "wallet", address: "x@example.com", verified_at: 100 },
      ]),
    ).toBeNull();
    expect(
      getVerifiedEmail([{ type: "google_oauth", email: "", verified_at: 100 }]),
    ).toBeNull();
  });
  test("accepts provider email but prefers a directly linked email", () => {
    expect(
      getVerifiedEmail([
        { type: "google_oauth", email: "google@example.com", verified_at: 100 },
      ]),
    ).toBe("google@example.com");
    expect(
      getVerifiedEmail([
        { type: "google_oauth", email: "google@example.com", verified_at: 100 },
        { type: "email", address: "direct@example.com", verified_at: 100 },
      ]),
    ).toBe("direct@example.com");
  });
  test("both layouts agree on incomplete profile and changed email states", () => {
    const member = {
      onboardingStatus: "completed",
      email: "member@example.com",
    };
    expect(hasCompletedOnboarding("member", member, "member@example.com")).toBe(
      true,
    );
    expect(
      hasCompletedOnboarding("user_0199beef", member, "member@example.com"),
    ).toBe(false);
    expect(hasCompletedOnboarding("member", member, null)).toBe(false);
    expect(
      hasCompletedOnboarding("member", member, "different@example.com"),
    ).toBe(false);
    expect(hasCompletedOnboarding(null, member, "member@example.com")).toBe(
      false,
    );
  });
  test("PlanetScale system root certificates keep TLS verification enabled", () => {
    const options = databaseConnectionOptions(
      "postgresql://test:test@db.example.com/postgres?sslmode=verify-full&sslrootcert=system",
    );
    expect(options.ssl).toEqual({ rejectUnauthorized: true });
    expect(
      new URL(options.connectionString!).searchParams.has("sslrootcert"),
    ).toBe(false);
    expect(new URL(options.connectionString!).searchParams.get("sslmode")).toBe(
      "verify-full",
    );
  });
});

describe("referral reward policy", () => {
  test("production invitations stay on the public origin behind a Netlify deploy proxy", () => {
    expect(
      referralLandingUrl(
        "https://deploy-id--fwdao.netlify.app/r/code",
        undefined,
        true,
      ).href,
    ).toBe("https://dao.fwtx.city/");
    expect(
      referralLandingUrl(
        "http://internal-proxy/r/code",
        "https://dao.fwtx.city",
        true,
      ).href,
    ).toBe("https://dao.fwtx.city/");
    expect(
      referralLandingUrl("http://localhost:3000/r/code", undefined, false).href,
    ).toBe("http://localhost:3000/");
  });
  test("monthly earns 10 and annual earns 120; discounted invoices scale down", () => {
    expect(membershipReferralPoints(500, 500, "month")).toBe(10);
    expect(membershipReferralPoints(4900, 4900, "year")).toBe(120);
    expect(membershipReferralPoints(2450, 4900, "year")).toBe(60);
    expect(membershipReferralPoints(600, 500, "month")).toBe(10);
    expect(membershipReferralPoints(0, 500, "month")).toBe(0);
    expect(membershipReferralPoints(500, 500, "lifetime")).toBe(0);
  });
  test("referral codes have a strict, normalized shape", () => {
    expect(normalizeReferralCode("a".repeat(32))).toBe("A".repeat(32));
    expect(normalizeReferralCode("../../admin")).toBeNull();
    expect(normalizeReferralCode("user_12345678")).toBeNull();
  });
  const invoice = {
    status: "paid",
    currency: "usd",
    amount_paid: 540,
    total: 540,
    total_excluding_tax: 500,
    total_taxes: [{ amount: 40 }],
    billing_reason: "subscription_cycle",
    lines: {
      has_more: false,
      data: [
        {
          amount: 500,
          quantity: 1,
          pricing: { price_details: { price: "price_month" } },
          parent: { subscription_item_details: { proration: false } },
        },
      ],
    },
  } as unknown as Stripe.Invoice;
  test("tax is excluded from the reward basis", () =>
    expect(referralInvoiceAmount(invoice, "price_month", 500)).toBe(500));
  for (const [name, change] of [
    ["unpaid", { status: "open" }],
    ["free", { amount_paid: 0 }],
    ["manual", { billing_reason: "manual" }],
    ["upgrade", { billing_reason: "subscription_update" }],
    ["non-USD", { currency: "eur" }],
    ["unpaginated", { lines: { ...invoice.lines, has_more: true } }],
    [
      "extra charge",
      {
        lines: {
          ...invoice.lines,
          data: [...invoice.lines.data, invoice.lines.data[0]],
        },
      },
    ],
    [
      "prorated",
      {
        lines: {
          ...invoice.lines,
          data: [
            {
              ...invoice.lines.data[0],
              parent: { subscription_item_details: { proration: true } },
            },
          ],
        },
      },
    ],
  ] as const) {
    test(`${name} invoice earns no referral points`, () =>
      expect(
        referralInvoiceAmount(
          { ...invoice, ...change } as Stripe.Invoice,
          "price_month",
          500,
        ),
      ).toBe(0));
  }
  test("an unrelated product price earns nothing", () =>
    expect(referralInvoiceAmount(invoice, "another_price", 500)).toBe(0));
});
