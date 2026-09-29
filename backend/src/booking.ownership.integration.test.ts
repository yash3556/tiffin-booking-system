import assert from "node:assert/strict";
import test from "node:test";
import { memoryAdapter, type MemoryDB } from "@better-auth/memory-adapter";
import { betterAuth } from "better-auth";
import { Hono } from "hono";
import { createAuthMiddleware } from "./middleware/auth.middleware.js";
import { BookingError } from "./services/booking.service.js";
import { createAuthRoutes } from "./routes/auth.routes.js";
import { createBookingRoutes } from "./routes/booking.routes.js";

const authStore: MemoryDB = {
  user: [],
  session: [],
  account: [],
  verification: [],
};
const bookingId = "owner-private-booking";
let bookingOwnerId: string | null = null;

const testAuth = betterAuth({
  appName: "Tiffin Hub Ownership Test",
  baseURL: "http://localhost:3000",
  secret: "test-only-secret-that-is-at-least-32-characters",
  database: memoryAdapter(authStore),
  emailAndPassword: { enabled: true },
  trustedOrigins: ["http://localhost:8081"],
});

const app = new Hono();
app.route("/api/auth", createAuthRoutes(testAuth.handler));
app.route(
  "/bookings",
  createBookingRoutes(
    {
      getCustomerForUser: async (userId) => ({
        id: `customer-for-${userId}`,
        name: "Test Customer",
        phone: "5550100",
        userId,
        createdAt: new Date(),
      }),
      getBooking: async (id, customerId) => {
        if (id !== bookingId || !bookingOwnerId) {
          return null;
        }
        if (customerId !== bookingOwnerId) {
          throw new BookingError("Forbidden", 403);
        }

        return {
          id,
          customerId,
          serviceId: "service-1",
          status: "PENDING" as const,
          createdAt: new Date(),
          customer: {
            id: customerId,
            name: "Test Customer",
            phone: "5550100",
            userId: customerId.replace("customer-for-", ""),
            createdAt: new Date(),
          },
          service: {
            id: "service-1",
            name: "Test Service",
            price: 100,
            createdAt: new Date(),
          },
          transactions: [],
        };
      },
    },
    createAuthMiddleware(async (headers) => {
      const session = await testAuth.api.getSession({ headers });
      return session ? { user: { id: session.user.id } } : null;
    })
  )
);

async function signupAndLogin(name: string) {
  const email = `${name.toLowerCase()}-${crypto.randomUUID()}@example.com`;
  const password = "a-strong-test-password";
  const signup = await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: {
      origin: "http://localhost:8081",
      "content-type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });
  assert.equal(signup.status, 200);
  const signupData = await signup.json();
  assert.equal(typeof signupData.user.id, "string");

  const login = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    headers: {
      origin: "http://localhost:8081",
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  return { cookie, userId: signupData.user.id };
}

test("distinguishes another user's existing booking from a missing booking", async () => {
  const owner = await signupAndLogin("Owner");
  const other = await signupAndLogin("Other");
  bookingOwnerId = `customer-for-${owner.userId}`;

  const ownerResponse = await app.request(`/bookings/${bookingId}`, {
    headers: { cookie: owner.cookie },
  });
  assert.equal(ownerResponse.status, 200);

  const otherResponse = await app.request(`/bookings/${bookingId}`, {
    headers: { cookie: other.cookie },
  });
  assert.equal(otherResponse.status, 403);

  const missingResponse = await app.request("/bookings/not-a-booking", {
    headers: { cookie: owner.cookie },
  });
  assert.equal(missingResponse.status, 404);
});
