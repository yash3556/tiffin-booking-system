import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  getRazorpayKeyId,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "./razorpay.js";

test("accepts only Razorpay Test Mode key IDs", () => {
  const previousKeyId = process.env.RAZORPAY_KEY_ID;
  try {
    process.env.RAZORPAY_KEY_ID = "rzp_live_not-allowed";
    assert.throws(() => getRazorpayKeyId(), /Test Mode/);
    process.env.RAZORPAY_KEY_ID = "rzp_test_example";
    assert.equal(getRazorpayKeyId(), "rzp_test_example");
  } finally {
    if (previousKeyId === undefined) {
      delete process.env.RAZORPAY_KEY_ID;
    } else {
      process.env.RAZORPAY_KEY_ID = previousKeyId;
    }
  }
});

test("verifies checkout signatures and rejects altered values", () => {
  const previousKeyId = process.env.RAZORPAY_KEY_ID;
  const previousSecret = process.env.RAZORPAY_KEY_SECRET;
  process.env.RAZORPAY_KEY_ID = "rzp_test_example";
  process.env.RAZORPAY_KEY_SECRET = "test-key-secret";
  try {
    const signature = createHmac("sha256", "test-key-secret")
      .update("order_test|payment_test")
      .digest("hex");
    assert.equal(
      verifyCheckoutSignature("order_test", "payment_test", signature),
      true
    );
    assert.equal(
      verifyCheckoutSignature("order_other", "payment_test", signature),
      false
    );
  } finally {
    if (previousKeyId === undefined) {
      delete process.env.RAZORPAY_KEY_ID;
    } else {
      process.env.RAZORPAY_KEY_ID = previousKeyId;
    }
    if (previousSecret === undefined) {
      delete process.env.RAZORPAY_KEY_SECRET;
    } else {
      process.env.RAZORPAY_KEY_SECRET = previousSecret;
    }
  }
});

test("verifies webhook signatures over exact raw bytes", () => {
  const previousKeyId = process.env.RAZORPAY_KEY_ID;
  const previousSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  process.env.RAZORPAY_KEY_ID = "rzp_test_example";
  process.env.RAZORPAY_WEBHOOK_SECRET = "test-webhook-secret";
  try {
    const body = Buffer.from('{ "event": "payment.captured" }\n');
    const signature = createHmac("sha256", "test-webhook-secret")
      .update(body)
      .digest("hex");
    assert.equal(verifyWebhookSignature(body, signature), true);
    assert.equal(
      verifyWebhookSignature(Buffer.from(body.toString().trimEnd()), signature),
      false
    );
  } finally {
    if (previousKeyId === undefined) {
      delete process.env.RAZORPAY_KEY_ID;
    } else {
      process.env.RAZORPAY_KEY_ID = previousKeyId;
    }
    if (previousSecret === undefined) {
      delete process.env.RAZORPAY_WEBHOOK_SECRET;
    } else {
      process.env.RAZORPAY_WEBHOOK_SECRET = previousSecret;
    }
  }
});
