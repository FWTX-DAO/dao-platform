import type Stripe from "stripe";

/** Only ordinary, paid membership cycles earn rewards. No taxes, extras, or prorations. */
export function referralInvoiceAmount(
  invoice: Stripe.Invoice,
  priceId: string,
  feeCents: number,
): number {
  if (
    invoice.status !== "paid" ||
    invoice.currency !== "usd" ||
    invoice.amount_paid <= 0 ||
    !["subscription_create", "subscription_cycle"].includes(
      invoice.billing_reason ?? "",
    ) ||
    invoice.lines.has_more
  )
    return 0;
  const lines = invoice.lines.data.filter((line) => line.amount !== 0);
  if (lines.length !== 1) return 0;
  const line = lines[0]!;
  const priceRef = line.pricing?.price_details?.price;
  const price = typeof priceRef === "string" ? priceRef : priceRef?.id;
  const subscriptionDetails = line.parent?.subscription_item_details;
  if (
    price !== priceId ||
    !subscriptionDetails ||
    subscriptionDetails.proration ||
    line.quantity !== 1 ||
    line.amount <= 0
  )
    return 0;
  const tax = (invoice.total_taxes ?? []).reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const net = invoice.total_excluding_tax ?? invoice.total - tax;
  return Math.max(
    0,
    Math.min(
      feeCents,
      line.amount,
      net,
      invoice.amount_paid - tax - (invoice.amount_paid_off_stripe ?? 0),
    ),
  );
}
