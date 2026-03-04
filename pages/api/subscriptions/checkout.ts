import type { NextApiRequest, NextApiResponse } from 'next';
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { membersService } from '@features/members';
import { subscriptionsService } from '@features/subscriptions';
import Stripe from 'stripe';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest;

  if (req.method === 'POST') {
    if (!process.env.STRIPE_SECRET_KEY) {
      return apiResponse.error(res, 'Stripe is not configured', 503);
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    });

    const { tierId } = req.body;
    if (!tierId) {
      return apiResponse.error(res, 'tierId is required', 400);
    }

    const member = await membersService.getMemberByUserId(user.id);
    const tiers = await subscriptionsService.getActiveTiers();
    const tier = tiers.find((t) => t.id === tierId);

    if (!tier) {
      return apiResponse.error(res, 'Tier not found', 404);
    }

    if (!tier.stripePriceId) {
      return apiResponse.error(res, 'This tier does not have a Stripe price configured', 400);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: tier.stripePriceId, quantity: 1 }],
      ...(member.stripeCustomerId
        ? { customer: member.stripeCustomerId }
        : { customer_email: member.email || undefined }),
      success_url: `${baseUrl}/subscriptions?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscriptions`,
      metadata: { memberId: member.id, tierId },
    });

    return apiResponse.success(res, { url: session.url });
  }

  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(errorHandler, withAuth)(handler);
