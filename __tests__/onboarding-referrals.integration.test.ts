import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { eq, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { generateId } from "../src/shared/utils/id-generator";

const testUrl = process.env.DAO_TEST_DATABASE_URL;

describe.skipIf(!testUrl)(
  "onboarding and referral PostgreSQL transactions",
  () => {
    let store: typeof import("../src/core/database");
    let queries: typeof import("../src/core/database/queries/users");
    let onboarding: typeof import("../src/app/_services/members/services/onboarding.service");
    let invoiceService: typeof import("../src/app/_services/subscriptions/services/membership-invoice.service");
    let referrals: typeof import("../src/app/_services/referrals");
    let monthlyTierId: string;
    let annualTierId: string;

    beforeAll(async () => {
      const url = new URL(testUrl!);
      if (
        url.hostname !== "127.0.0.1" ||
        url.port !== "55433" ||
        url.pathname !== "/dao_referral_test"
      ) {
        throw new Error(
          "Refusing to run destructive fixtures outside the dedicated localhost test database",
        );
      }
      process.env.DATABASE_URL = testUrl;
      process.env.STRIPE_PRICE_MONTHLY = "price_month_fixture";
      process.env.STRIPE_PRICE_ANNUAL = "price_year_fixture";
      store = await import("../src/core/database");
      queries = await import("../src/core/database/queries/users");
      onboarding =
        await import("../src/app/_services/members/services/onboarding.service");
      invoiceService =
        await import("../src/app/_services/subscriptions/services/membership-invoice.service");
      referrals = await import("../src/app/_services/referrals");
    });

    beforeEach(async () => {
      await store.db.execute(
        sql`TRUNCATE TABLE users, membership_tiers, roles CASCADE`,
      );
      await store.db.insert(store.roles).values([
        { id: generateId(), name: "guest", displayName: "Observer", level: 0 },
        { id: generateId(), name: "member", displayName: "Member", level: 10 },
      ]);
      monthlyTierId = generateId();
      annualTierId = generateId();
      await store.db.insert(store.membershipTiers).values([
        {
          id: monthlyTierId,
          name: "monthly",
          displayName: "Monthly",
          priceCents: 500,
          billingInterval: "month",
          stripePriceId: "price_month_fixture",
        },
        {
          id: annualTierId,
          name: "annual",
          displayName: "Annual",
          priceCents: 4900,
          billingInterval: "year",
          stripePriceId: "price_year_fixture",
        },
      ]);
    });

    afterAll(async () => {
      await store?.db.$client.end();
    });

    const profile = (
      username: string,
      email: string,
      referralCode?: string,
    ) => ({
      username,
      email,
      firstName: "Test",
      lastName: "Member",
      termsAccepted: true as const,
      referralCode,
    });
    const newUser = () =>
      queries.getOrCreateUser(`did:privy:fixture-${generateId()}`);

    async function invitation() {
      const referrer = await newUser();
      const completed = await onboarding.completeMemberOnboarding(
        referrer.id,
        profile("inviter", "inviter@example.test"),
        "inviter@example.test",
      );
      const code = await referrals.referralsRepository.ensureCode(referrer.id);
      const recipient = await newUser();
      return {
        referrer,
        referrerMemberId: completed.memberId,
        recipient,
        code,
      };
    }

    async function referredMember() {
      const setup = await invitation();
      const result = await onboarding.completeMemberOnboarding(
        setup.recipient.id,
        profile("invitee", "invitee@example.test", setup.code),
        "invitee@example.test",
      );
      return { ...setup, memberId: result.memberId };
    }

    async function points(memberId: string) {
      const [member] = await store.db
        .select()
        .from(store.members)
        .where(eq(store.members.id, memberId));
      return member!.contributionPoints;
    }

    test("concurrent identity creation produces one user and one stable code, without a default username", async () => {
      const did = `did:privy:concurrent-${generateId()}`;
      const results = await Promise.all(
        Array.from({ length: 5 }, () => queries.getOrCreateUser(did)),
      );
      expect(new Set(results.map((row) => row.id)).size).toBe(1);
      expect(results[0]!.username).toBeNull();
      expect(await store.db.select().from(store.referralCodes)).toHaveLength(1);
    });

    test("unverified or spoofed email cannot complete onboarding", async () => {
      const user = await newUser();
      await expect(
        onboarding.completeMemberOnboarding(
          user.id,
          profile("newmember", "claimed@example.test"),
          null,
        ),
      ).rejects.toThrow("Verify your email");
      await expect(
        onboarding.completeMemberOnboarding(
          user.id,
          profile("newmember", "claimed@example.test"),
          "actual@example.test",
        ),
      ).rejects.toThrow("Verify your email");
      expect(await store.db.select().from(store.members)).toHaveLength(0);
      expect(
        (await store.db.select().from(store.users))[0]!.username,
      ).toBeNull();
    });

    test("user_ names are rejected by onboarding, profile edits, and direct database writes", async () => {
      const user = await newUser();
      await expect(
        onboarding.completeMemberOnboarding(
          user.id,
          profile("User_new", "member@example.test"),
          "member@example.test",
        ),
      ).rejects.toThrow("reserved");
      await expect(
        queries.updateUserProfile(user.privyDid, { username: "user_short" }),
      ).rejects.toThrow("reserved");
      await expect(
        store.db
          .update(store.users)
          .set({ username: " USER_any_suffix " })
          .where(eq(store.users.id, user.id))
          .execute(),
      ).rejects.toThrow();
      expect(
        (await store.db.select().from(store.users))[0]!.username,
      ).toBeNull();
    });

    test("missing RBAC configuration rolls back profile, username, and member creation", async () => {
      const user = await newUser();
      await store.db.delete(store.roles).where(eq(store.roles.name, "guest"));
      await expect(
        onboarding.completeMemberOnboarding(
          user.id,
          profile("newmember", "member@example.test"),
          "member@example.test",
        ),
      ).rejects.toThrow("guest role");
      expect(await store.db.select().from(store.members)).toHaveLength(0);
      expect(
        (await store.db.select().from(store.users))[0]!.username,
      ).toBeNull();
    });

    test("signup, verified email, role, reward ledger, activity, and balance commit together", async () => {
      const setup = await referredMember();
      const [member] = await store.db
        .select()
        .from(store.members)
        .where(eq(store.members.id, setup.memberId));
      expect(member!.email).toBe("invitee@example.test");
      expect(member!.emailVerifiedAt).toBeInstanceOf(Date);
      expect(member!.onboardingStatus).toBe("completed");
      expect(await points(setup.referrerMemberId)).toBe(5);
      expect(await store.db.select().from(store.referrals)).toHaveLength(1);
      expect(await store.db.select().from(store.referralRewards)).toHaveLength(
        1,
      );
      expect(await store.db.select().from(store.memberActivities)).toHaveLength(
        1,
      );
    });

    test("concurrent onboarding retries award the signup bonus once", async () => {
      const setup = await invitation();
      await Promise.all(
        Array.from({ length: 4 }, () =>
          onboarding.completeMemberOnboarding(
            setup.recipient.id,
            profile("invitee", "invitee@example.test", setup.code),
            "invitee@example.test",
          ),
        ),
      );
      expect(await points(setup.referrerMemberId)).toBe(5);
      expect(await store.db.select().from(store.referralRewards)).toHaveLength(
        1,
      );
      expect(
        await store.db
          .select()
          .from(store.memberRoles)
          .where(
            eq(
              store.memberRoles.memberId,
              (
                await store.db
                  .select()
                  .from(store.members)
                  .where(eq(store.members.userId, setup.recipient.id))
              )[0]!.id,
            ),
          ),
      ).toHaveLength(1);
    });

    test("invalid referral rolls back completion and can be cleared on retry", async () => {
      const user = await newUser();
      await expect(
        onboarding.completeMemberOnboarding(
          user.id,
          profile("newmember", "member@example.test", "BAD"),
          "member@example.test",
        ),
      ).rejects.toThrow("referral code");
      expect(await store.db.select().from(store.members)).toHaveLength(0);
      expect(
        (await store.db.select().from(store.users))[0]!.username,
      ).toBeNull();
      await onboarding.completeMemberOnboarding(
        user.id,
        profile("newmember", "member@example.test", ""),
        "member@example.test",
      );
      expect(await store.db.select().from(store.members)).toHaveLength(1);
    });

    test("another account with the same verified email cannot generate a second signup reward", async () => {
      const setup = await referredMember();
      const second = await newUser();
      await onboarding.completeMemberOnboarding(
        second.id,
        profile("another", "invitee@example.test", setup.code),
        "invitee@example.test",
      );
      expect(await points(setup.referrerMemberId)).toBe(5);
      expect(await store.db.select().from(store.referrals)).toHaveLength(1);
    });

    test("self referral through the same verified email is rejected", async () => {
      const setup = await invitation();
      await expect(
        onboarding.completeMemberOnboarding(
          setup.recipient.id,
          profile("another", "inviter@example.test", setup.code),
          "inviter@example.test",
        ),
      ).rejects.toThrow("own referral");
      expect(await points(setup.referrerMemberId)).toBe(0);
    });

    test("a wallet collision uses a savepoint without losing the verified profile", async () => {
      const setup = await invitation();
      await store.db
        .update(store.users)
        .set({ walletAddress: "0xfixture" })
        .where(eq(store.users.id, setup.referrer.id));
      const result = await onboarding.completeMemberOnboarding(
        setup.recipient.id,
        profile("invitee", "invitee@example.test"),
        "invitee@example.test",
        "0xfixture",
      );
      expect(result.walletSyncError).toBeDefined();
      const [member] = await store.db
        .select()
        .from(store.members)
        .where(eq(store.members.id, result.memberId));
      expect(member!.onboardingStatus).toBe("completed");
    });

    function stripeFixture(memberId: string, annual = false) {
      const price = annual ? "price_year_fixture" : "price_month_fixture";
      const amount = annual ? 4900 : 500;
      const now = Math.floor(Date.now() / 1000) + 10;
      const remote = {
        id: "sub_fixture",
        customer: "cus_fixture",
        status: "active",
        metadata: { memberId, tierId: annual ? annualTierId : monthlyTierId },
        items: {
          data: [
            {
              current_period_start: now,
              current_period_end: now + 86400,
              price: { id: price },
            },
          ],
        },
      } as unknown as Stripe.Subscription;
      const invoice = {
        id: "in_fixture",
        customer: "cus_fixture",
        status: "paid",
        currency: "usd",
        amount_paid: amount,
        total: amount,
        total_excluding_tax: amount,
        total_taxes: [],
        billing_reason: "subscription_create",
        created: now,
        status_transitions: { paid_at: now },
        hosted_invoice_url: null,
        parent: { subscription_details: { subscription: "sub_fixture" } },
        lines: {
          has_more: false,
          data: [
            {
              amount,
              quantity: 1,
              pricing: { price_details: { price } },
              parent: { subscription_item_details: { proration: false } },
            },
          ],
        },
      } as unknown as Stripe.Invoice;
      const client = {
        invoices: {
          retrieve: async (id: string) => ({ ...invoice, id }),
          listLineItems: () => {
            throw new Error("Unexpected pagination");
          },
        },
        subscriptions: { retrieve: async () => remote },
        checkout: {
          sessions: {
            list: async () => ({
              data: [
                {
                  metadata: {
                    memberId,
                    tierId: annual ? annualTierId : monthlyTierId,
                  },
                },
              ],
            }),
          },
        },
      } as unknown as Stripe;
      return { client, invoice, remote };
    }

    test("invoice before checkout creates the subscription and awards exactly once across concurrent retries", async () => {
      const setup = await referredMember();
      const stripe = stripeFixture(setup.memberId);
      await Promise.all(
        Array.from({ length: 4 }, () =>
          invoiceService.processMembershipInvoice("in_first", stripe.client),
        ),
      );
      expect(await points(setup.referrerMemberId)).toBe(15);
      expect(await store.db.select().from(store.subscriptions)).toHaveLength(1);
      expect(await store.db.select().from(store.paymentHistory)).toHaveLength(
        1,
      );
      expect(await store.db.select().from(store.referralRewards)).toHaveLength(
        2,
      );
      expect(await points(setup.memberId)).toBe(100);
      const summary = await referrals.referralsRepository.getSummary(
        setup.referrer.id,
      );
      expect({
        invited: summary.invitedMembers,
        paid: summary.paidMembers,
        points: summary.earnedPoints,
      }).toEqual({ invited: 1, paid: 1, points: 15 });
    });

    test("first annual payment and renewal each earn 120 points", async () => {
      const setup = await referredMember();
      const stripe = stripeFixture(setup.memberId, true);
      await invoiceService.processMembershipInvoice(
        "in_annual_first",
        stripe.client,
      );
      stripe.invoice.billing_reason = "subscription_cycle";
      await invoiceService.processMembershipInvoice(
        "in_annual_renewal",
        stripe.client,
      );
      expect(await points(setup.referrerMemberId)).toBe(245);
      expect(await points(setup.memberId)).toBe(100);
    });

    test("a monthly member switching to annual earns annual points even with old checkout metadata", async () => {
      const setup = await referredMember();
      const monthly = stripeFixture(setup.memberId);
      await invoiceService.processMembershipInvoice("in_month", monthly.client);
      const annual = stripeFixture(setup.memberId, true);
      annual.remote.metadata.tierId = monthlyTierId;
      annual.invoice.billing_reason = "subscription_cycle";
      await invoiceService.processMembershipInvoice("in_year", annual.client);
      expect(await points(setup.referrerMemberId)).toBe(135);
      const [member] = await store.db
        .select()
        .from(store.members)
        .where(eq(store.members.id, setup.memberId));
      expect(member!.currentTierId).toBe(annualTierId);
    });

    test("membership invoice failure rolls back payment and points, then succeeds on retry", async () => {
      const setup = await referredMember();
      const stripe = stripeFixture(setup.memberId);
      await store.db.delete(store.roles).where(eq(store.roles.name, "member"));
      await expect(
        invoiceService.processMembershipInvoice("in_retry", stripe.client),
      ).rejects.toThrow("Member role");
      expect(await store.db.select().from(store.paymentHistory)).toHaveLength(
        0,
      );
      expect(await store.db.select().from(store.subscriptions)).toHaveLength(0);
      expect(await points(setup.referrerMemberId)).toBe(5);
      await store.db.insert(store.roles).values({
        id: generateId(),
        name: "member",
        displayName: "Member",
        level: 10,
      });
      await invoiceService.processMembershipInvoice("in_retry", stripe.client);
      expect(await points(setup.referrerMemberId)).toBe(15);
    });

    test("legacy Stripe subscriptions resolve through checkout metadata", async () => {
      const setup = await referredMember();
      const stripe = stripeFixture(setup.memberId);
      stripe.remote.metadata = {};
      await invoiceService.processMembershipInvoice("in_legacy", stripe.client);
      expect(await points(setup.referrerMemberId)).toBe(15);
    });

    test("unpaid invoices and payments from before attribution earn no points", async () => {
      const setup = await referredMember();
      const stripe = stripeFixture(setup.memberId);
      stripe.invoice.status = "open";
      await invoiceService.processMembershipInvoice("in_unpaid", stripe.client);
      expect(await store.db.select().from(store.paymentHistory)).toHaveLength(
        0,
      );
      stripe.invoice.status = "paid";
      stripe.invoice.status_transitions.paid_at = 1;
      await invoiceService.processMembershipInvoice(
        "in_historical",
        stripe.client,
      );
      expect(await points(setup.referrerMemberId)).toBe(5);
    });

    test("database rejects completed members without an email even if a caller bypasses the service", async () => {
      const user = await newUser();
      await expect(
        store.db
          .insert(store.members)
          .values({
            id: generateId(),
            userId: user.id,
            onboardingStatus: "completed",
            email: " ",
          })
          .execute(),
      ).rejects.toThrow();
    });
  },
);
