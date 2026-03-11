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
    // Step 1: Validate env vars
    const envCheck = {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      NEXT_PUBLIC_PRIVY_APP_ID: !!process.env.NEXT_PUBLIC_PRIVY_APP_ID,
      PRIVY_APP_SECRET: !!process.env.PRIVY_APP_SECRET,
      STRIPE_PRICE_MONTHLY: !!process.env.STRIPE_PRICE_MONTHLY,
      STRIPE_PRICE_ANNUAL: !!process.env.STRIPE_PRICE_ANNUAL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'NOT SET',
      DATABASE_URL: !!process.env.DATABASE_URL,
    };
    console.log('[checkout] ENV check:', JSON.stringify(envCheck));

    const stripe = getStripe();
    const privy = getPrivy();

    // Step 2: Auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }

    const authToken = authHeader.replace(/^Bearer /, '');
    let claims;
    try {
      claims = await privy.verifyAuthToken(authToken);
    } catch (authErr: any) {
      console.error('[checkout] Privy auth failed:', authErr.message);
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }
    console.log('[checkout] Auth OK, userId:', claims.userId);

    // Step 3: User resolution
    const user = await getOrCreateUser(claims.userId, (claims as any).email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.log('[checkout] User OK:', user.id);

    // Step 4: Member resolution
    const member = await membersService.getOrCreateMember(user.id);
    if (!member) {
      return NextResponse.json({ error: 'Could not create member' }, { status: 500 });
    }
    console.log('[checkout] Member OK:', member.id, 'stripeCustomerId:', member.stripeCustomerId ?? 'none');

    // Step 5: Parse body
    const body = await request.json();
    const { tierId } = body;

    if (!tierId) {
      return NextResponse.json({ error: 'tierId is required' }, { status: 400 });
    }
    console.log('[checkout] tierId:', tierId);

    // Step 6: Tier lookup
    const tier = await db.select().from(membershipTiers).where(eq(membershipTiers.id, tierId)).limit(1);
    console.log('[checkout] Tier found:', tier[0]?.name ?? 'NOT FOUND', 'stripePriceId:', tier[0]?.stripePriceId ?? 'null');

    // Env vars take priority so the same DB works across test/live Stripe modes
    const tierName = tier[0]?.name;
    const envPrice = tierName === 'monthly' || tierName === 'pro'
      ? process.env.STRIPE_PRICE_MONTHLY
      : tierName === 'annual'
        ? process.env.STRIPE_PRICE_ANNUAL
        : null;
    const priceId = envPrice || tier[0]?.stripePriceId;
    if (!tier[0] || !priceId) {
      return NextResponse.json(
        { error: `Invalid tier or missing Stripe price. Tier: ${tier[0]?.name ?? 'not found'}, priceId: ${priceId ?? 'null'}` },
        { status: 400 },
      );
    }
    console.log('[checkout] Resolved priceId:', priceId);

    // Step 7: Resolve or create Stripe customer
    // If the stored customer ID belongs to a different Stripe mode (test vs live),
    // Stripe will reject it. In that case, create a fresh customer in the current mode.
    let stripeCustomerId = member.stripeCustomerId;

    const ensureStripeCustomer = async (): Promise<string> => {
      if (stripeCustomerId) {
        try {
          // Validate the stored customer still exists in the current Stripe mode
          await stripe.customers.retrieve(stripeCustomerId);
          return stripeCustomerId;
        } catch {
          console.warn('[checkout] Stored customer invalid, creating new one. Old:', stripeCustomerId);
        }
      }

      const customer = await stripe.customers.create({
        email: (claims as any).email || undefined,
        metadata: { userId: user.id, memberId: member.id },
      });
      console.log('[checkout] Stripe customer created:', customer.id);

      await db
        .update(members)
        .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
        .where(eq(members.id, member.id));

      return customer.id;
    };

    stripeCustomerId = await ensureStripeCustomer();

    // Step 8: Create checkout session
    console.log('[checkout] Creating checkout session for customer:', stripeCustomerId, 'price:', priceId);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/passport?success=true`,
      cancel_url: `${appUrl}/billing?canceled=true`,
      metadata: { memberId: member.id, tierId },
    });

    console.log('[checkout] Session created, redirecting to:', session.url);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[checkout] FAILED at step - error:', err.message);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
