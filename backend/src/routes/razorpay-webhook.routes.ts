import { Hono } from "hono";
import { verifyWebhookSignature } from "../lib/razorpay.js";
import { processRazorpayWebhook } from "../services/razorpay-webhook.service.js";

const webhookServices = { verifyWebhookSignature, processRazorpayWebhook };
type WebhookRouteDependencies = Partial<typeof webhookServices>;

export function createRazorpayWebhookRoutes(
  overrides: WebhookRouteDependencies = {}
) {
  const services = { ...webhookServices, ...overrides };
  const routes = new Hono();
  routes.post("/razorpay", async (c) => {
    const rawBody = new Uint8Array(await c.req.arrayBuffer());
    const signature = c.req.header("X-Razorpay-Signature");
    const eventId = c.req.header("x-razorpay-event-id");
    if (!signature || !eventId) {
      return c.json(
        { success: false, message: "Webhook headers are required" },
        400
      );
    }

    try {
      if (!services.verifyWebhookSignature(rawBody, signature)) {
        return c.json(
          { success: false, message: "Invalid webhook signature" },
          400
        );
      }
      let body: unknown;
      try {
        body = JSON.parse(new TextDecoder().decode(rawBody));
      } catch {
        return c.json(
          { success: false, message: "Invalid webhook JSON" },
          400
        );
      }
      const result = await services.processRazorpayWebhook(eventId, body);
      return c.json({ success: true, duplicate: result.duplicate });
    } catch (error) {
      console.error("Could not process Razorpay webhook", error);
      return c.json(
        { success: false, message: "Could not process webhook" },
        500
      );
    }
  });
  return routes;
}

export default createRazorpayWebhookRoutes();
