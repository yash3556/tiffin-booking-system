import assert from "node:assert/strict";
import test from "node:test";
import { Hono } from "hono";
import { createAuthMiddleware } from "../middleware/auth.middleware.js";
import { TransactionError } from "../services/transaction.service.js";
import { createTransactionRoutes } from "./transaction.routes.js";

const customer = {
  id: "customer-1",
  name: "Test Customer",
  phone: "5550100",
  userId: "user-1",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};
const transaction = {
  id: "transaction-1",
  bookingId: "booking-1",
  amount: 100,
  currency: "INR",
  idempotencyKey: "request-key",
  razorpayOrderId: "order-1",
  razorpayPaymentId: "payment-1",
  status: "SUCCESS" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};
const paymentAttempt = {
  ...transaction,
  razorpayPaymentId: null,
  status: "PENDING" as const,
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function createApp(
  overrides: Parameters<typeof createTransactionRoutes>[0] = {},
  userId: string | null = "user-1"
) {
  const middleware = createAuthMiddleware(async () =>
    userId ? { user: { id: userId } } : null
  );
  const app = new Hono();
  app.route(
    "/transactions",
    createTransactionRoutes(
      {
        getCustomerForUser: async (id) => ({
          ...customer,
          id: id === "user-1" ? customer.id : `customer-for-${id}`,
          userId: id,
        }),
        initiatePayment: async (bookingId) => ({
          transaction: { ...paymentAttempt, bookingId },
          keyId: "rzp_test_example",
          created: true,
          processing: false,
        }),
        verifyPayment: async () => transaction,
        getTransaction: async (id) =>
          id === transaction.id ? transaction : null,
        getTransactionsForBooking: async () => [transaction],
        getTransactionsForCustomer: async () => [transaction],
        ...overrides,
      },
      middleware
    )
  );
  return app;
}

test("transaction APIs require a session", async () => {
  const app = createApp({}, null);
  for (const path of [
    "/transactions",
    "/transactions/transaction-1",
    "/transactions/transaction-1/verify",
    "/transactions/booking/booking-1",
  ]) {
    const response = await app.request(path);
    assert.equal(response.status, 401);
  }
});

test("creates transactions for owned bookings using the session customer", async () => {
  let createdWith: [string, string, string] | undefined;
  const app = createApp({
    initiatePayment: async (bookingId, customerId, key) => {
      createdWith = [bookingId, customerId, key];
      return {
        transaction: { ...paymentAttempt, bookingId },
        keyId: "rzp_test_example",
        created: true,
        processing: false,
      };
    },
  });
  const response = await app.request("/transactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": "request-key",
    },
    body: JSON.stringify({
      bookingId: "booking-1",
    }),
  });

  assert.equal(response.status, 201);
  assert.deepEqual(createdWith, ["booking-1", customer.id, "request-key"]);
  assert.equal((await response.json()).data.status, "PENDING");
});

test("returns mock verification details without changing the transaction response fields", async () => {
  const app = createApp({
    initiatePayment: async () => ({
      transaction: paymentAttempt,
      keyId: "mock",
      mockPayment: {
        orderId: "mock_order_transaction-1",
        paymentId: "mock_payment_transaction-1",
        amount: 10000,
        currency: "INR",
        status: "captured" as const,
        signature: "local-signature",
      },
      created: true,
      processing: false,
    }),
  });
  const response = await app.request("/transactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": "request-key",
    },
    body: JSON.stringify({ bookingId: "booking-1" }),
  });
  const result = await response.json();

  assert.equal(response.status, 201);
  assert.equal(result.data.id, paymentAttempt.id);
  assert.equal(result.data.keyId, "mock");
  assert.equal(result.data.mockPayment.paymentId, "mock_payment_transaction-1");
  assert.equal(result.data.mockPayment.signature, "local-signature");
});

test("payment initiation rejects a client-supplied amount", async () => {
  const response = await createApp().request("/transactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": "request-key",
    },
    body: JSON.stringify({ bookingId: "booking-1", amount: 1 }),
  });
  assert.equal(response.status, 400);
});

test("payment initiation requires an idempotency key", async () => {
  const response = await createApp().request("/transactions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ bookingId: "booking-1" }),
  });
  assert.equal(response.status, 400);
});

test("verifies payment results with the session-derived customer", async () => {
  let verifiedWith: [string, string, string, string, string] | undefined;
  const app = createApp({
    verifyPayment: async (transactionId, customerId, orderId, paymentId, signature) => {
      verifiedWith = [transactionId, customerId, orderId, paymentId, signature];
      return transaction;
    },
  });
  const response = await app.request(
    "/transactions/transaction-1/verify",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: "order-1",
        razorpay_payment_id: "payment-1",
        razorpay_signature: "signature",
      }),
    }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(verifiedWith, [
    "transaction-1",
    customer.id,
    "order-1",
    "payment-1",
    "signature",
  ]);
});

test("rejects transaction creation for another customer's booking", async () => {
  const app = createApp({
    initiatePayment: async () => {
      throw new TransactionError("Forbidden", 403);
    },
  });
  const response = await app.request("/transactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": "request-key",
    },
    body: JSON.stringify({ bookingId: "booking-other" }),
  });
  assert.equal(response.status, 403);
});

test("lists transactions for only the session customer", async () => {
  let listedFor: string | undefined;
  const app = createApp({
    getTransactionsForCustomer: async (customerId) => {
      listedFor = customerId;
      return [transaction];
    },
  });
  const response = await app.request("/transactions");
  assert.equal(response.status, 200);
  assert.equal(listedFor, customer.id);
});

test("gets own transaction and distinguishes forbidden from missing", async () => {
  const app = createApp({
    getTransaction: async (id) => {
      if (id === "transaction-other") {
        throw new TransactionError("Forbidden", 403);
      }
      return id === transaction.id ? transaction : null;
    },
  });
  assert.equal((await app.request("/transactions/transaction-1")).status, 200);
  assert.equal(
    (await app.request("/transactions/transaction-other")).status,
    403
  );
  assert.equal(
    (await app.request("/transactions/not-found")).status,
    404
  );
});

test("booking transaction history distinguishes forbidden and missing bookings", async () => {
  const app = createApp({
    getTransactionsForBooking: async (bookingId) => {
      if (bookingId === "booking-other") {
        throw new TransactionError("Forbidden", 403);
      }
      if (bookingId !== "booking-1") {
        throw new TransactionError("Booking not found", 404);
      }
      return [transaction];
    },
  });
  assert.equal(
    (await app.request("/transactions/booking/booking-1")).status,
    200
  );
  assert.equal(
    (await app.request("/transactions/booking/booking-other")).status,
    403
  );
  assert.equal(
    (await app.request("/transactions/booking/not-found")).status,
    404
  );
});
