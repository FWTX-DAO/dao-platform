import { db } from "@core/database";
import {
  membershipTiers,
  subscriptions,
  paymentHistory,
} from "@core/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateId } from "@shared/utils";

export class SubscriptionsRepository {
  // --- Tiers ---

  async findAllTiers() {
    return db
      .select()
      .from(membershipTiers)
      .where(eq(membershipTiers.isActive, true))
      .orderBy(membershipTiers.sortOrder);
  }

  async findTierByName(name: string) {
    const results = await db
      .select()
      .from(membershipTiers)
      .where(eq(membershipTiers.name, name))
      .limit(1);
    return results[0] ?? null;
  }

  async findTierById(id: string) {
    const results = await db
      .select()
      .from(membershipTiers)
      .where(eq(membershipTiers.id, id))
      .limit(1);
    return results[0] ?? null;
  }

  // --- Subscriptions ---

  async findByMember(memberId: string) {
    return db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.memberId, memberId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async findActiveByMember(memberId: string) {
    const results = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.memberId, memberId),
          eq(subscriptions.status, "active"),
        ),
      )
      .limit(1);
    return results[0] ?? null;
  }

  async findByStripeSubscriptionId(stripeSubId: string) {
    const results = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubId))
      .limit(1);
    return results[0] ?? null;
  }

  async findByStripeCustomerId(stripeCustomerId: string) {
    return db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async create(data: {
    memberId: string;
    tierId: string;
    stripeSubscriptionId?: string;
    stripeCustomerId: string;
    status?: string;
    currentPeriodStart?: Date | string;
    currentPeriodEnd?: Date | string;
  }) {
    const id = generateId();
    const now = new Date();

    await db.insert(subscriptions).values({
      id,
      memberId: data.memberId,
      tierId: data.tierId,
      stripeSubscriptionId: data.stripeSubscriptionId ?? null,
      stripeCustomerId: data.stripeCustomerId,
      status: data.status ?? "active",
      currentPeriodStart: data.currentPeriodStart
        ? new Date(data.currentPeriodStart)
        : null,
      currentPeriodEnd: data.currentPeriodEnd
        ? new Date(data.currentPeriodEnd)
        : null,
      createdAt: now,
      updatedAt: now,
    });

    const inserted = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);
    return inserted[0]!;
  }

  async update(
    id: string,
    data: Partial<{
      status: string;
      currentPeriodStart: Date | string;
      currentPeriodEnd: Date | string;
      canceledAt: Date | string;
      cancelReason: string;
      trialEnd: Date | string;
    }>,
  ) {
    const {
      currentPeriodStart,
      currentPeriodEnd,
      canceledAt,
      trialEnd,
      ...rest
    } = data;
    await db
      .update(subscriptions)
      .set({
        ...rest,
        ...(currentPeriodStart !== undefined && {
          currentPeriodStart: new Date(currentPeriodStart),
        }),
        ...(currentPeriodEnd !== undefined && {
          currentPeriodEnd: new Date(currentPeriodEnd),
        }),
        ...(canceledAt !== undefined && { canceledAt: new Date(canceledAt) }),
        ...(trialEnd !== undefined && { trialEnd: new Date(trialEnd) }),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id));
  }

  // --- Payments ---

  async createPayment(data: {
    subscriptionId: string;
    stripePaymentIntentId?: string;
    amountCents: number;
    currency?: string;
    status: string;
    paidAt?: Date | string;
    failureReason?: string;
    receiptUrl?: string;
  }) {
    const id = generateId();
    const now = new Date();

    await db.insert(paymentHistory).values({
      id,
      subscriptionId: data.subscriptionId,
      stripePaymentIntentId: data.stripePaymentIntentId ?? null,
      amountCents: data.amountCents,
      currency: data.currency ?? "usd",
      status: data.status,
      paidAt: data.paidAt ? new Date(data.paidAt) : null,
      failureReason: data.failureReason ?? null,
      receiptUrl: data.receiptUrl ?? null,
      createdAt: now,
    });

    return { id, ...data, createdAt: now };
  }

  async findPaymentsBySubscription(subscriptionId: string) {
    return db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.subscriptionId, subscriptionId))
      .orderBy(desc(paymentHistory.createdAt));
  }
}

export const subscriptionsRepository = new SubscriptionsRepository();
