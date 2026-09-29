import assert from "node:assert/strict";
import test from "node:test";
import { Hono } from "hono";
import { createAuthMiddleware } from "./auth.middleware.js";
import { createBookingRoutes } from "../routes/booking.routes.js";

const customer = {
  id: "customer-1",
  name: "Test Customer",
  phone: "5550100",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  userId: "user-1",
};

function createApp(
  userId: string | null,
  dependencies: Parameters<typeof createBookingRoutes>[0] = {}
) {
  const middleware = createAuthMiddleware(async () =>
    userId ? { user: { id: userId } } : null
  );
  const app = new Hono();
  app.route("/bookings", createBookingRoutes(dependencies, middleware));
  return app;
}

test("rejects protected bookings when there is no session", async () => {
  const response = await createApp(null).request("/bookings");

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    success: false,
    message: "Authentication required",
  });
});

test("rejects an invalid or expired session", async () => {
  const response = await createApp(null).request("/bookings", {
    headers: { cookie: "better-auth.session_token=expired-or-invalid" },
  });

  assert.equal(response.status, 401);
});

test("allows a valid session to read the signed-in customer's bookings", async () => {
  let queriedCustomerId: string | undefined;
  const app = createApp("user-1", {
    getCustomerForUser: async (userId) => {
      assert.equal(userId, "user-1");
      return customer;
    },
    getBookingsForCustomer: async (customerId) => {
      queriedCustomerId = customerId;
      return [];
    },
  });

  const response = await app.request("/bookings");

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: [] });
  assert.equal(queriedCustomerId, customer.id);
});

test("reports missing customer data separately after authentication", async () => {
  const response = await createApp("user-1", {
    getCustomerForUser: async () => null,
  }).request("/bookings");

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    success: false,
    message: "Customer onboarding is required",
  });
});

test("does not expose another customer's booking", async () => {
  let lookup: [string, string] | undefined;
  const app = createApp("user-1", {
    getCustomerForUser: async () => customer,
    getBooking: async (bookingId, customerId) => {
      lookup = [bookingId, customerId];
      return null;
    },
  });

  const response = await app.request("/bookings/private-booking");

  assert.equal(response.status, 404);
  assert.deepEqual(lookup, ["private-booking", customer.id]);
});

test("returns a controlled 400 for malformed protected booking JSON", async () => {
  const response = await createApp("user-1").request("/bookings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    success: false,
    message: "Valid serviceId is required",
  });
});
