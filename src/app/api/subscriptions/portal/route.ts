import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrivyClient } from '@privy-io/server-auth';
import { membersService } from '@services/members';
import { getOrCreateUser } from '@core/database/queries/users';

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

  if (!member.stripeCustomerId) {
    return NextResponse.json({ error: 'No Stripe customer found. Subscribe to a plan first.' }, { status: 400 });
  }

  // Validate the stored customer exists in the current Stripe mode
  try {
    await stripe.customers.retrieve(member.stripeCustomerId);
  } catch {
    console.warn('[portal] Stored customer invalid (mode mismatch?):', member.stripeCustomerId);
    return NextResponse.json(
      { error: 'Your Stripe customer record is invalid. Please subscribe again to refresh it.' },
      { status: 400 },
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: member.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing`,
  });

  return NextResponse.json({ url: session.url });
}
