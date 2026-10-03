import assert from "node:assert/strict";
import test from "node:test";
import { mockPaymentProvider } from "./mock-payment-provider.js";
import { getPaymentProvider } from "./payment-provider.js";

test("mock provider creates deterministic local payment details", async () => {
  const previousSecret = process.env.MOCK_PAYMENT_SECRET;
  const previousProvider = process.env.PAYMENT_PROVIDER;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.MOCK_PAYMENT_SECRET = "local-test-secret";
  process.env.PAYMENT_PROVIDER = "mock";
  process.env.NODE_ENV = "development";

  try {
    const order = await mockPaymentProvider.createOrder({
      amount: 12500,
      currency: "INR",
      receipt: "transaction-1",
      notes: { transactionId: "transaction-1", bookingId: "booking-1" },
    });
    const payment = order.mockPayment;

    assert.equal(order.id, "mock_order_transaction-1");
    assert.equal(order.amount, 12500);
    assert.equal(order.currency, "INR");
    assert.ok(payment);
    assert.equal(payment.paymentId, "mock_payment_transaction-1");
    assert.equal(payment.status, "captured");
    assert.equal(
      mockPaymentProvider.verifyCheckoutSignature(
        payment.orderId,
        payment.paymentId,
        payment.signature
      ),
      true
    );
    assert.equal(getPaymentProvider(), mockPaymentProvider);

    const fetched = await mockPaymentProvider.fetchPayment(payment.paymentId, {
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
    });
    assert.deepEqual(fetched, {
      id: payment.paymentId,
      order_id: payment.orderId,
      amount: 12500,
      currency: "INR",
      status: "captured",
      captured: true,
    });
  } finally {
    restoreEnvironment("MOCK_PAYMENT_SECRET", previousSecret);
    restoreEnvironment("PAYMENT_PROVIDER", previousProvider);
    restoreEnvironment("NODE_ENV", previousNodeEnv);
  }
});

test("mock provider rejects invalid signatures and cannot run in production", () => {
  const previousSecret = process.env.MOCK_PAYMENT_SECRET;
  const previousProvider = process.env.PAYMENT_PROVIDER;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.MOCK_PAYMENT_SECRET = "local-test-secret";
  process.env.PAYMENT_PROVIDER = "mock";

  try {
    assert.equal(
      mockPaymentProvider.verifyCheckoutSignature(
        "mock_order_transaction-1",
        "mock_payment_transaction-1",
        "invalid"
      ),
      false
    );
    process.env.NODE_ENV = "production";
    assert.throws(() => getPaymentProvider(), /not available in production/);
  } finally {
    restoreEnvironment("MOCK_PAYMENT_SECRET", previousSecret);
    restoreEnvironment("PAYMENT_PROVIDER", previousProvider);
    restoreEnvironment("NODE_ENV", previousNodeEnv);
  }
});

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
