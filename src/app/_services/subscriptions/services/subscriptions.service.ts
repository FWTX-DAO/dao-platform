import { db } from "@core/database";
import { members } from "@core/database/schema";
import { eq } from "drizzle-orm";
import { NotFoundError } from "@core/errors";
import { SubscriptionsRepository } from "./subscriptions.repository";
import { rbacService } from "@services/rbac";
import { activitiesService } from "@services/activities";
import Stripe from "stripe";

export class SubscriptionsService {
  private _stripe: Stripe | null = null;

  constructor(private repository: SubscriptionsRepository) {}

  private getStripe(): Stripe {
    if (!this._stripe) {
      this._stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-02-25.clover",
      });
    }
    return this._stripe;
  }

  async getActiveTiers() {
    return this.repository.findAllTiers();
  }

  async getActiveSubscription(memberId: string) {
    return this.repository.findActiveByMember(memberId);
  }

  async createSubscription(
    memberId: string,
    tierId: string,
    stripeData: {
      stripeSubscriptionId?: string;
      stripeCustomerId: string;
      periodStart?: string;
      periodEnd?: string;
    },
  ) {
    const tier = await this.repository.findTierById(tierId);
    if (!tier) throw new NotFoundError("Membership tier");

    const sub = await this.repository.create({
      memberId,
      tierId,
      stripeSubscriptionId: stripeData.stripeSubscriptionId,
      stripeCustomerId: stripeData.stripeCustomerId,
      currentPeriodStart: stripeData.periodStart,
      currentPeriodEnd: stripeData.periodEnd,
    });

    // Update member's current tier
    await db
      .update(members)
      .set({
        currentTierId: tierId,
        stripeCustomerId: stripeData.stripeCustomerId,
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId));

    // Track subscription activity — resolve userId from memberId
    const member = await db
      .select({ userId: members.userId })
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1)
      .then((r) => r[0]);
    if (member) {
      await activitiesService.trackActivity(
        member.userId,
        "subscription_created",
        "subscription",
        sub.id,
      );
    }

    return sub;
  }

  /**
   * Process incoming Stripe webhook events.
   * Handles subscription lifecycle and syncs RBAC roles automatically.
   */
  async updateFromWebhook(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const memberId = session.metadata?.memberId;
        const tierId = session.metadata?.tierId;
        if (!memberId || !tierId) break;

        const stripeCustomerId =
          typeof session.customer === "string"
            ? session.customer
            : (session.customer as Stripe.Customer)?.id;
        if (!stripeCustomerId) break;

        const stripeSubRef =
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription as Stripe.Subscription)?.id;

        // Idempotency: skip if subscription already recorded
        if (stripeSubRef) {
          const existing =
            await this.repository.findByStripeSubscriptionId(stripeSubRef);
          if (existing) break;
        }

        // Fetch full subscription from Stripe to get period data
        let periodStart: string | undefined;
        let periodEnd: string | undefined;
        if (stripeSubRef) {
          const stripeSub =
            await this.getStripe().subscriptions.retrieve(stripeSubRef);
          const item = stripeSub.items?.data?.[0];
          if (item?.current_period_start)
            periodStart = new Date(
              item.current_period_start * 1000,
            ).toISOString();
          if (item?.current_period_end)
            periodEnd = new Date(item.current_period_end * 1000).toISOString();
        }

        // Create subscription record + update member tier
        await this.createSubscription(memberId, tierId, {
          stripeSubscriptionId: stripeSubRef,
          stripeCustomerId,
          periodStart,
          periodEnd,
        });

        // Auto-assign member RBAC role (idempotent)
        await rbacService.assignRole(memberId, "member");
        break;
      }

      case "customer.subscription.updated": {
        const stripeSub = event.data.object as Stripe.Subscription;
        const sub = await this.repository.findByStripeSubscriptionId(
          stripeSub.id,
        );
        if (!sub) break;
        // Period data lives on subscription items in Stripe SDK v20+
        const item = stripeSub.items?.data?.[0];
        await this.repository.update(sub.id, {
          status: stripeSub.status,
          ...(item?.current_period_start && {
            currentPeriodStart: new Date(item.current_period_start * 1000),
          }),
          ...(item?.current_period_end && {
            currentPeriodEnd: new Date(item.current_period_end * 1000),
          }),
        });
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSub = event.data.object as Stripe.Subscription;
        const sub = await this.repository.findByStripeSubscriptionId(
          stripeSub.id,
        );
        if (!sub) break;
        await this.repository.update(sub.id, {
          status: "canceled",
          canceledAt: new Date(),
        });

        // Downgrade RBAC: revoke member role, assign guest
        await rbacService.revokeRole(sub.memberId, "member");
        await rbacService.assignRole(sub.memberId, "guest");

        // Reset member tier to null
        await db
          .update(members)
          .set({ currentTierId: null, updatedAt: new Date() })
          .where(eq(members.id, sub.memberId));
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // In Stripe SDK v20+, subscription ref moved to invoice.parent.subscription_details
        const subRef = invoice.parent?.subscription_details?.subscription;
        const subId = typeof subRef === "string" ? subRef : subRef?.id;
        if (!subId) break;
        const sub = await this.repository.findByStripeSubscriptionId(subId);
        if (!sub) break;
        await this.repository.createPayment({
          subscriptionId: sub.id,
          amountCents: invoice.amount_paid,
          currency: invoice.currency,
          status: "succeeded",
          paidAt: new Date(),
          receiptUrl: invoice.hosted_invoice_url ?? undefined,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subRefFailed = invoice.parent?.subscription_details?.subscription;
        const subIdFailed =
          typeof subRefFailed === "string" ? subRefFailed : subRefFailed?.id;
        if (!subIdFailed) break;
        const sub =
          await this.repository.findByStripeSubscriptionId(subIdFailed);
        if (!sub) break;
        await this.repository.update(sub.id, { status: "past_due" });
        await this.repository.createPayment({
          subscriptionId: sub.id,
          amountCents: invoice.amount_due,
          currency: invoice.currency,
          status: "failed",
          failureReason: "Payment failed",
        });
        break;
      }
    }
  }

  async cancelSubscription(subscriptionId: string) {
    await this.repository.update(subscriptionId, {
      status: "canceled",
      canceledAt: new Date(),
    });
  }

  async getPaymentHistory(memberId: string) {
    const subs = await this.repository.findByMember(memberId);
    const payments = [];
    for (const sub of subs) {
      const subPayments = await this.repository.findPaymentsBySubscription(
        sub.id,
      );
      payments.push(...subPayments);
    }
    // Sort by most recent
    payments.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    return payments;
  }
}

export const subscriptionsService = new SubscriptionsService(
  new SubscriptionsRepository(),
);
