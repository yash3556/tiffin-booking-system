import assert from "node:assert/strict";
import test from "node:test";
import { Hono } from "hono";
import { createAuthMiddleware } from "../middleware/auth.middleware.js";
import { BookingError } from "../services/booking.service.js";
import { createBookingRoutes } from "./booking.routes.js";

const customer = {
  id: "customer-1",
  name: "Test Customer",
  phone: "5550100",
  userId: "user-1",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};
const service = {
  id: "service-1",
  name: "Test Service",
  price: 100,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};
const booking = {
  id: "booking-1",
  customerId: customer.id,
  serviceId: service.id,
  status: "PENDING" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};
const detailedBooking = {
  ...booking,
  customer,
  service,
  transactions: [],
};
const bookingHistory = {
  id: "history-1",
  bookingId: booking.id,
  fromStatus: null,
  toStatus: "PENDING" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

function createApp(
  overrides: Parameters<typeof createBookingRoutes>[0] = {},
  userId: string | null = "user-1"
) {
  const middleware = createAuthMiddleware(async () =>
    userId ? { user: { id: userId } } : null
  );
  const app = new Hono();
  app.route(
    "/bookings",
    createBookingRoutes(
      {
        getCustomerForUser: async (id) => ({
          ...customer,
          id: id === "user-1" ? customer.id : `customer-for-${id}`,
          userId: id,
        }),
        createBooking: async (customerId, serviceId) => ({
          ...booking,
          customerId,
          serviceId,
        }),
        getBookingsForCustomer: async () => [detailedBooking],
        getBooking: async (id, customerId) => {
          if (id === "booking-other" && customerId === customer.id) {
            throw new BookingError("Forbidden", 403);
          }
          return id === booking.id && customerId === customer.id
            ? detailedBooking
            : null;
        },
        getBookingHistory: async (id, customerId) => {
          if (id === "booking-other" && customerId === customer.id) {
            throw new BookingError("Forbidden", 403);
          }
          if (id !== booking.id || customerId !== customer.id) {
            throw new BookingError("Booking not found", 404);
          }
          return [bookingHistory];
        },
        updateBookingStatus: async (id, customerId) => {
          if (id === "booking-other" && customerId === customer.id) {
            throw new BookingError("Forbidden", 403);
          }
          if (id !== booking.id || customerId !== customer.id) {
            throw new BookingError("Booking not found", 404);
          }
          return { ...booking, status: "CONFIRMED" as const };
        },
        ...overrides,
      },
      middleware
    )
  );
  return app;
}

test("booking APIs require a session", async () => {
  const app = createApp({}, null);
  for (const path of ["/bookings", "/bookings/booking-1/history"]) {
    const response = await app.request(path);
    assert.equal(response.status, 401);
  }
});

test("creates and lists bookings using the session-derived customer", async () => {
  let createdFor: string | undefined;
  let listedFor: string | undefined;
  const app = createApp({
    createBooking: async (customerId, serviceId) => {
      createdFor = customerId;
      return { ...booking, customerId, serviceId };
    },
    getBookingsForCustomer: async (customerId) => {
      listedFor = customerId;
      return [detailedBooking];
    },
  });

  const created = await app.request("/bookings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      serviceId: "service-1",
      userId: "attacker",
      customerId: "attacker",
    }),
  });
  assert.equal(created.status, 201);
  assert.equal(createdFor, customer.id);

  const listed = await app.request("/bookings");
  assert.equal(listed.status, 200);
  assert.equal(listedFor, customer.id);
  assert.deepEqual(
    (await listed.json()).data,
    JSON.parse(JSON.stringify([detailedBooking]))
  );
});

test("gets own booking and distinguishes forbidden from missing bookings", async () => {
  const app = createApp();
  assert.equal((await app.request("/bookings/booking-1")).status, 200);
  assert.equal((await app.request("/bookings/booking-other")).status, 403);
  assert.equal((await app.request("/bookings/not-found")).status, 404);
});

test("booking history returns own history and distinguishes forbidden and missing", async () => {
  const app = createApp();
  assert.equal(
    (await app.request("/bookings/booking-1/history")).status,
    200
  );
  assert.equal(
    (await app.request("/bookings/booking-other/history")).status,
    403
  );
  assert.equal(
    (await app.request("/bookings/not-found/history")).status,
    404
  );
});

test("does not update another customer's booking", async () => {
  let updated = false;
  let passedCustomerId: string | undefined;
  const app = createApp({
    updateBookingStatus: async (id, customerId) => {
      passedCustomerId = customerId;
      if (id === "booking-other") {
        throw new BookingError("Forbidden", 403);
      }
      updated = true;
      return { ...booking, status: "CONFIRMED" as const };
    },
  });
  const response = await app.request("/bookings/booking-other/status", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "CONFIRMED" }),
  });
  assert.equal(response.status, 403);
  assert.equal(passedCustomerId, customer.id);
  assert.equal(updated, false);
});
