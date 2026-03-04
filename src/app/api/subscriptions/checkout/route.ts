import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrivyClient } from '@privy-io/server-auth';
import { membersService } from '@features/members';
import { subscriptionsService } from '@features/subscriptions';
import { getOrCreateUser } from '@core/database/queries/users';
import { db, membershipTiers } from '@core/database';
import { eq } from 'drizzle-orm';

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

  const body = await request.json();
  const { tierId } = body;

  if (!tierId) {
    return NextResponse.json({ error: 'tierId is required' }, { status: 400 });
  }

  const tier = await db.select().from(membershipTiers).where(eq(membershipTiers.id, tierId)).limit(1);
  if (!tier[0] || !tier[0].stripePriceId) {
    return NextResponse.json({ error: 'Invalid tier or missing Stripe price' }, { status: 400 });
  }

  // Get or create Stripe customer
  let stripeCustomerId = member.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: { userId: user.id, memberId: member.id },
    });
    stripeCustomerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: tier[0].stripePriceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscriptions?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscriptions?canceled=true`,
    metadata: { memberId: member.id, tierId },
  });

  return NextResponse.json({ url: session.url });
}
