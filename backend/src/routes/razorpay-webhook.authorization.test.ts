import assert from "node:assert/strict";
import test from "node:test";
import { Hono } from "hono";
import { createRazorpayWebhookRoutes } from "./razorpay-webhook.routes.js";

function createApp(overrides: Parameters<typeof createRazorpayWebhookRoutes>[0]) {
  const app = new Hono();
  app.route("/webhooks", createRazorpayWebhookRoutes(overrides));
  return app;
}

test("rejects webhook requests without signature and event id", async () => {
  const response = await createApp({}).request("/webhooks/razorpay", {
    method: "POST",
    body: "{}",
  });
  assert.equal(response.status, 400);
});

test("rejects invalid webhook signatures without processing the event", async () => {
  let processed = false;
  const app = createApp({
    verifyWebhookSignature: () => false,
    processRazorpayWebhook: async () => {
      processed = true;
      return { duplicate: false };
    },
  });
  const response = await app.request("/webhooks/razorpay", {
    method: "POST",
    headers: {
      "X-Razorpay-Signature": "invalid",
      "x-razorpay-event-id": "event-1",
    },
    body: "{}",
  });
  assert.equal(response.status, 400);
  assert.equal(processed, false);
});

test("passes event identity and unmodified signed JSON to the processor", async () => {
  const rawBody = '{ "event": "payment.captured" }\n';
  let processed: [string, unknown] | undefined;
  const app = createApp({
    verifyWebhookSignature: (body, signature) =>
      new TextDecoder().decode(body) === rawBody && signature === "valid",
    processRazorpayWebhook: async (eventId, body) => {
      processed = [eventId, body];
      return { duplicate: true };
    },
  });
  const response = await app.request("/webhooks/razorpay", {
    method: "POST",
    headers: {
      "X-Razorpay-Signature": "valid",
      "x-razorpay-event-id": "event-1",
    },
    body: rawBody,
  });
  assert.equal(response.status, 200);
  assert.deepEqual(processed, ["event-1", { event: "payment.captured" }]);
  assert.equal((await response.json()).duplicate, true);
});
