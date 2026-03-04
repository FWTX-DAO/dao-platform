import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrivyClient } from '@privy-io/server-auth';
import { membersService } from '@features/members';
import { getOrCreateUser } from '@core/database/queries/users';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
  }

  const authToken = authHeader.replace(/^Bearer /, '');
  let claims;
  try {
    claims = await privy.verifyAuthToken(authToken);
  } catch {
    return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
  }

  const user = await getOrCreateUser(claims.userId, (claims as any).email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const member = await membersService.getOrCreateMember(user.id);

  if (!member.stripeCustomerId) {
    return NextResponse.json({ error: 'No Stripe customer found. Subscribe to a plan first.' }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: member.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscriptions`,
  });

  return NextResponse.json({ url: session.url });
}
