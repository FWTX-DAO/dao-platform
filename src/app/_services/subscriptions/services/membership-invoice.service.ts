import Stripe from "stripe";
import { and, eq, sql } from "drizzle-orm";
import {
  db,
  members,
  membershipTiers,
  subscriptions,
  paymentHistory,
  roles,
  memberRoles,
  memberActivities,
} from "@core/database";
import { generateId } from "@utils/id-generator";
import { referralsService } from "@services/referrals";
import { referralInvoiceAmount } from "./referral-invoice";
import { ACTIVITY_POINTS } from "@shared/constants";

const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : value?.id;

/** Resolve from Stripe so invoice delivery can safely precede checkout delivery. */
export async function processMembershipInvoice(
  invoiceId: string,
  stripe: Stripe,
) {
  const invoice = await stripe.invoices.retrieve(invoiceId);
  const stripeSubscriptionId = idOf(
    invoice.parent?.subscription_details?.subscription,
  );
  if (!stripeSubscriptionId || invoice.status !== "paid") return;
  if (invoice.lines.has_more) {
    const lines: Stripe.InvoiceLineItem[] = [];
    for await (const line of stripe.invoices.listLineItems(invoice.id, {
      limit: 100,
    }))
      lines.push(line);
    invoice.lines = { ...invoice.lines, data: lines, has_more: false };
  }
  const remote = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
  let memberId = existing?.memberId ?? remote.metadata.memberId;
  if (!memberId) {
    // Subscriptions created before subscription_data.metadata was introduced.
    const sessions = await stripe.checkout.sessions.list({
      subscription: stripeSubscriptionId,
      limit: 2,
    });
    const session = sessions.data.find(
      (item) => item.metadata?.memberId && item.metadata?.tierId,
    );
    memberId = session?.metadata?.memberId;
  }
  if (!memberId) return; // Another product in the same Stripe account.
  const tiers = await db.select().from(membershipTiers);
  const priceFor = (tier: (typeof tiers)[number]) =>
    (tier.name === "monthly" || tier.name === "pro"
      ? process.env.STRIPE_PRICE_MONTHLY
      : tier.name === "annual"
        ? process.env.STRIPE_PRICE_ANNUAL
        : undefined) || tier.stripePriceId;
  const currentPrice = remote.items.data[0]?.price.id;
  const tier = tiers.find((candidate) => priceFor(candidate) === currentPrice);
  if (!tier) throw new Error("Membership subscription price is not configured");
  const customerId = idOf(invoice.customer);
  if (!customerId || customerId !== idOf(remote.customer))
    throw new Error("Membership invoice customer mismatch");
  const invoicePrice = idOf(
    invoice.lines.data.find((line) => line.amount > 0)?.pricing?.price_details
      ?.price,
  );
  const invoiceTier = tiers.find(
    (candidate) =>
      !!priceFor(candidate) && priceFor(candidate) === invoicePrice,
  );
  const amount =
    invoiceTier && invoicePrice
      ? referralInvoiceAmount(invoice, invoicePrice, invoiceTier.priceCents)
      : 0;
  const paidAt = new Date(
    (invoice.status_transitions.paid_at ?? invoice.created) * 1000,
  );
  const item = remote.items.data[0];
  const resolvedMemberId = memberId;

  await db.transaction(async (tx) => {
    // Both duplicate deliveries and different event types for one invoice serialize here.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${stripeSubscriptionId}))`,
    );
    const [member] = await tx
      .select()
      .from(members)
      .where(eq(members.id, resolvedMemberId))
      .for("update");
    if (!member || member.onboardingStatus !== "completed" || !member.email)
      throw new Error("Membership invoice has no completed member");
    if (member.stripeCustomerId && member.stripeCustomerId !== customerId)
      throw new Error("Member customer mismatch");
    const [priorSubscription] = await tx
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
    const values = {
      memberId: member.id,
      tierId: tier.id,
      stripeSubscriptionId,
      stripeCustomerId: customerId,
      status: remote.status,
      currentPeriodStart: item
        ? new Date(item.current_period_start * 1000)
        : null,
      currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
      updatedAt: new Date(),
    };
    const [subscription] = await tx
      .insert(subscriptions)
      .values({ id: generateId(), ...values })
      .onConflictDoUpdate({
        target: subscriptions.stripeSubscriptionId,
        set: values,
      })
      .returning();
    if (!subscription) throw new Error("Subscription could not be recorded");
    if (!priorSubscription) {
      const bonus = ACTIVITY_POINTS.subscription_created;
      await tx.insert(memberActivities).values({
        id: generateId(),
        memberId: member.id,
        activityType: "subscription_created",
        resourceType: "subscription",
        resourceId: subscription.id,
        pointsAwarded: bonus,
      });
      await tx
        .update(members)
        .set({
          contributionPoints: sql`${members.contributionPoints} + ${bonus}`,
          updatedAt: new Date(),
        })
        .where(eq(members.id, member.id));
    }
    if (remote.status === "active") {
      await tx
        .update(members)
        .set({
          currentTierId: tier.id,
          stripeCustomerId: customerId,
          updatedAt: new Date(),
        })
        .where(eq(members.id, member.id));
      const [role] = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, "member"));
      if (!role) throw new Error("Member role is not configured");
      const [assignment] = await tx
        .select({ id: memberRoles.id })
        .from(memberRoles)
        .where(
          and(
            eq(memberRoles.memberId, member.id),
            eq(memberRoles.roleId, role.id),
          ),
        )
        .limit(1);
      if (assignment)
        await tx
          .update(memberRoles)
          .set({ isActive: true })
          .where(eq(memberRoles.id, assignment.id));
      else
        await tx
          .insert(memberRoles)
          .values({ id: generateId(), memberId: member.id, roleId: role.id });
    }
    const payment = {
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      amountCents: invoice.amount_paid,
      currency: invoice.currency,
      status: "succeeded",
      paidAt,
      receiptUrl: invoice.hosted_invoice_url,
    };
    await tx
      .insert(paymentHistory)
      .values({ id: generateId(), ...payment })
      .onConflictDoUpdate({
        target: paymentHistory.stripeInvoiceId,
        set: payment,
      });
    if (invoiceTier)
      await referralsService.awardMembership(
        tx,
        member.id,
        invoice.id,
        amount,
        paidAt,
        invoiceTier.priceCents,
        invoiceTier.billingInterval,
      );
  });
}
