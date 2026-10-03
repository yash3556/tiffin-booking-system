import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";

let razorpayClient: Razorpay | undefined;

export function getRazorpayClient() {
  if (razorpayClient) {
    return razorpayClient;
  }

  const keyId = getRazorpayKeyId();
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET must be configured");
  }

  razorpayClient = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  return razorpayClient;
}

export function getRazorpayKeyId() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error("RAZORPAY_KEY_ID must be configured");
  }
  if (!keyId.startsWith("rzp_test_")) {
    throw new Error("Only Razorpay Test Mode keys are accepted");
  }
  return keyId;
}

export function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string
) {
  getRazorpayKeyId();
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET must be configured");
  }
  return verifyHmac(`${orderId}|${paymentId}`, signature, secret);
}

export function verifyWebhookSignature(body: Uint8Array, signature: string) {
  getRazorpayKeyId();
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET must be configured");
  }
  return verifyHmac(body, signature, secret);
}

function verifyHmac(payload: string | Uint8Array, signature: string, secret: string) {
  if (!/^[a-f\d]{64}$/i.test(signature)) {
    return false;
  }
  const expected = createHmac("sha256", secret).update(payload).digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
