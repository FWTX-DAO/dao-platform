import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrivyClient } from '@privy-io/server-auth';
import { membersService } from '@services/members';
import { getOrCreateUser } from '@core/database/queries/users';
import { db, membershipTiers, members } from '@core/database';
import { eq } from 'drizzle-orm';

let _stripe: Stripe | null = null;
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });
  return _stripe;
}

let _privy: PrivyClient | null = null;
function getPrivy() {
  if (!_privy) _privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!);
  return _privy;
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const privy = getPrivy();

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
    if (!member) {
      return NextResponse.json({ error: 'Could not create member' }, { status: 500 });
    }

    const body = await request.json();
    const { tierId } = body;

    if (!tierId) {
      return NextResponse.json({ error: 'tierId is required' }, { status: 400 });
    }

    const tier = await db.select().from(membershipTiers).where(eq(membershipTiers.id, tierId)).limit(1);
    const priceId = tier[0]?.stripePriceId
      || (tier[0]?.name === 'monthly' || tier[0]?.name === 'pro' ? process.env.STRIPE_PRICE_MONTHLY : null)
      || (tier[0]?.name === 'annual' ? process.env.STRIPE_PRICE_ANNUAL : null);
    if (!tier[0] || !priceId) {
      return NextResponse.json(
        { error: `Invalid tier or missing Stripe price. Tier: ${tier[0]?.name ?? 'not found'}, priceId: ${priceId ?? 'null'}` },
        { status: 400 },
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId = member.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: (claims as any).email || undefined,
        metadata: { userId: user.id, memberId: member.id },
      });
      stripeCustomerId = customer.id;

      // Persist stripeCustomerId to members table
      await db
        .update(members)
        .set({ stripeCustomerId, updatedAt: new Date() })
        .where(eq(members.id, member.id));
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?canceled=true`,
      metadata: { memberId: member.id, tierId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[checkout] Error creating Stripe checkout session:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
