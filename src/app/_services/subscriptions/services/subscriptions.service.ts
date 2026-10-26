import { db } from "@core/database";
import { members } from "@core/database/schema";
import { eq } from "drizzle-orm";
import { NotFoundError } from "@core/errors";
import { SubscriptionsRepository } from "./subscriptions.repository";
import { rbacService } from "@services/rbac";
import { activitiesService } from "@services/activities";
import Stripe from "stripe";
import { processMembershipInvoice } from "./membership-invoice.service";

export class SubscriptionsService {
  private _stripe: Stripe | null = null;

  constructor(private repository: SubscriptionsRepository) {}

  private getStripe(): Stripe {
    if (!this._stripe) {
      this._stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-09-30.endive",
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
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (
          session.mode !== "subscription" ||
          session.payment_status !== "paid"
        )
          break;
        const invoiceId =
          typeof session.invoice === "string"
            ? session.invoice
            : session.invoice?.id;
        if (!invoiceId)
          throw new Error("Paid membership checkout has no invoice");
        await processMembershipInvoice(invoiceId, this.getStripe());
        break;
      }

      case "customer.subscription.updated": {
        const stripeSub = await this.getStripe().subscriptions.retrieve(
          (event.data.object as Stripe.Subscription).id,
        );
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

      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await processMembershipInvoice(invoice.id, this.getStripe());
        break;
      }

      case "invoice.payment_failed": {
        const invoice = await this.getStripe().invoices.retrieve(
          (event.data.object as Stripe.Invoice).id,
        );
        if (invoice.status === "paid") {
          await processMembershipInvoice(invoice.id, this.getStripe());
          break;
        }
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
          stripeInvoiceId: invoice.id,
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
