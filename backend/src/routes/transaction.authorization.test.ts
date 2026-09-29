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
  status: "SUCCESS" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
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
        createTransaction: async (bookingId, amount) => ({
          ...transaction,
          bookingId,
          amount,
        }),
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
    "/transactions/booking/booking-1",
  ]) {
    const response = await app.request(path);
    assert.equal(response.status, 401);
  }
});

test("creates transactions for owned bookings using the session customer", async () => {
  let createdWith: [string, number, string] | undefined;
  const app = createApp({
    createTransaction: async (bookingId, amount, customerId) => {
      createdWith = [bookingId, amount, customerId];
      return { ...transaction, bookingId, amount };
    },
  });
  const response = await app.request("/transactions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      bookingId: "booking-1",
      amount: 100,
      userId: "attacker",
      customerId: "attacker",
    }),
  });

  assert.equal(response.status, 201);
  assert.deepEqual(createdWith, ["booking-1", 100, customer.id]);
});

test("rejects transaction creation for another customer's booking", async () => {
  const app = createApp({
    createTransaction: async () => {
      throw new TransactionError("Forbidden", 403);
    },
  });
  const response = await app.request("/transactions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ bookingId: "booking-other", amount: 100 }),
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
