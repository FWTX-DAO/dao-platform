import type { NextApiRequest, NextApiResponse } from 'next';
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { membersService } from '@features/members';
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

    const member = await membersService.getMemberByUserId(user.id);

    if (!member.stripeCustomerId) {
      return apiResponse.error(res, 'No Stripe customer found. Subscribe first.', 400);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;

    const session = await stripe.billingPortal.sessions.create({
      customer: member.stripeCustomerId,
      return_url: `${baseUrl}/subscriptions`,
    });

    return apiResponse.success(res, { url: session.url });
  }

  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(errorHandler, withAuth)(handler);
