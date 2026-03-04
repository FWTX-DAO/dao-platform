import { db } from '@core/database';
import { members } from '@core/database/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '@core/errors';
import { SubscriptionsRepository } from './subscriptions.repository';
import type Stripe from 'stripe';

export class SubscriptionsService {
  constructor(private repository: SubscriptionsRepository) {}

  async getActiveTiers() {
    return this.repository.findAllTiers();
  }

  async getActiveSubscription(memberId: string) {
    return this.repository.findActiveByMember(memberId);
  }

  async createSubscription(
    memberId: string,
    tierId: string,
    stripeData: { stripeSubscriptionId?: string; stripeCustomerId: string; periodStart?: string; periodEnd?: string },
  ) {
    const tier = await this.repository.findTierById(tierId);
    if (!tier) throw new NotFoundError('Membership tier');

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
      .set({ currentTierId: tierId, stripeCustomerId: stripeData.stripeCustomerId, updatedAt: new Date() })
      .where(eq(members.id, memberId));

    return sub;
  }

  /**
   * Process incoming Stripe webhook events.
   */
  async updateFromWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as Stripe.Subscription;
        const sub = await this.repository.findByStripeSubscriptionId(stripeSub.id);
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

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription;
        const sub = await this.repository.findByStripeSubscriptionId(stripeSub.id);
        if (!sub) break;
        await this.repository.update(sub.id, {
          status: 'canceled',
          canceledAt: new Date(),
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // In Stripe SDK v20+, subscription ref moved to invoice.parent.subscription_details
        const subRef = invoice.parent?.subscription_details?.subscription;
        const subId = typeof subRef === 'string' ? subRef : subRef?.id;
        if (!subId) break;
        const sub = await this.repository.findByStripeSubscriptionId(subId);
        if (!sub) break;
        await this.repository.createPayment({
          subscriptionId: sub.id,
          amountCents: invoice.amount_paid,
          currency: invoice.currency,
          status: 'succeeded',
          paidAt: new Date(),
          receiptUrl: invoice.hosted_invoice_url ?? undefined,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subRefFailed = invoice.parent?.subscription_details?.subscription;
        const subIdFailed = typeof subRefFailed === 'string' ? subRefFailed : subRefFailed?.id;
        if (!subIdFailed) break;
        const sub = await this.repository.findByStripeSubscriptionId(subIdFailed);
        if (!sub) break;
        await this.repository.update(sub.id, { status: 'past_due' });
        await this.repository.createPayment({
          subscriptionId: sub.id,
          amountCents: invoice.amount_due,
          currency: invoice.currency,
          status: 'failed',
          failureReason: 'Payment failed',
        });
        break;
      }
    }
  }

  async cancelSubscription(subscriptionId: string) {
    await this.repository.update(subscriptionId, {
      status: 'canceled',
      canceledAt: new Date(),
    });
  }

  async getPaymentHistory(memberId: string) {
    const subs = await this.repository.findByMember(memberId);
    const payments = [];
    for (const sub of subs) {
      const subPayments = await this.repository.findPaymentsBySubscription(sub.id);
      payments.push(...subPayments);
    }
    // Sort by most recent
    payments.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    return payments;
  }
}

export const subscriptionsService = new SubscriptionsService(new SubscriptionsRepository());
