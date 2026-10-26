import { afterAll, expect, mock, test } from "bun:test";
import Stripe from "stripe";

const originalSecret = process.env.STRIPE_SECRET_KEY;
const originalWebhook = process.env.STRIPE_WEBHOOK_SECRET;
process.env.STRIPE_SECRET_KEY = "sk_test_local_fixture";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_local_fixture";
let fail = false;
let calls = 0;
mock.module("@services/subscriptions", () => ({
  subscriptionsService: {
    updateFromWebhook: async () => {
      calls++;
      if (fail) throw new Error("Fixture database unavailable");
    },
  },
}));
const { POST } = await import("../src/app/api/webhooks/stripe/route");
const stripe = new Stripe("sk_test_local_fixture");
const payload = JSON.stringify({
  id: "evt_fixture",
  type: "invoice.paid",
  data: { object: { id: "in_fixture" } },
});
const signature = () =>
  stripe.webhooks.generateTestHeaderStringAsync({
    payload,
    secret: "whsec_local_fixture",
  });
const request = (header?: string) =>
  new Request("https://example.test/api/webhooks/stripe", {
    method: "POST",
    headers: header ? { "stripe-signature": header } : {},
    body: payload,
  });

test("missing or invalid Stripe signatures cannot reach fulfillment", async () => {
  expect((await POST(request())).status).toBe(400);
  expect((await POST(request("invalid"))).status).toBe(400);
  expect(calls).toBe(0);
});
test("processing failures return 500 so Stripe can retry", async () => {
  fail = true;
  expect((await POST(request(await signature()))).status).toBe(500);
});
test("successful processing is acknowledged", async () => {
  fail = false;
  expect((await POST(request(await signature()))).status).toBe(200);
});

afterAll(() => {
  if (originalSecret === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = originalSecret;
  if (originalWebhook === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
  else process.env.STRIPE_WEBHOOK_SECRET = originalWebhook;
});
