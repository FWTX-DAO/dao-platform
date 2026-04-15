import { NextResponse } from "next/server";
import Stripe from "stripe";
import { subscriptionsService } from "@services/subscriptions";

let _stripe: Stripe | null = null;
function getStripe() {
  if (!_stripe)
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });
  return _stripe;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  try {
    await subscriptionsService.updateFromWebhook(event);
  } catch (err) {
    console.error("Error processing Stripe webhook:", err);
    // Still return 200 to prevent Stripe from retrying
  }

  return NextResponse.json({ received: true });
}
