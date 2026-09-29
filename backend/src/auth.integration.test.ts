import assert from "node:assert/strict";
import test from "node:test";
import { memoryAdapter, type MemoryDB } from "@better-auth/memory-adapter";
import { betterAuth } from "better-auth";
import { Hono } from "hono";
import { createAuthMiddleware } from "./middleware/auth.middleware.js";
import { createAuthRoutes } from "./routes/auth.routes.js";
import { createBookingRoutes } from "./routes/booking.routes.js";

const authStore: MemoryDB = {
  user: [],
  session: [],
  account: [],
  verification: [],
};

const bookingOwners = new Map<string, string>();
const usersWithoutCustomer = new Set<string>();
let customerLookupCount = 0;

const testAuth = betterAuth({
  appName: "Tiffin Hub Test",
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
      getCustomerForUser: async (userId) => {
        customerLookupCount += 1;
        if (usersWithoutCustomer.has(userId)) {
          return null;
        }

        return {
          id: `customer-for-${userId}`,
          name: "Test Customer",
          phone: "5550100",
          userId,
          createdAt: new Date(),
        };
      },
      getBookingsForCustomer: async () => [],
      getBooking: async (bookingId, customerId) =>
        bookingOwners.get(bookingId) === customerId
          ? {
              id: bookingId,
              customerId,
              serviceId: "service-1",
              status: "PENDING",
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
            }
          : null,
    },
    createAuthMiddleware(async (headers) => {
      const session = await testAuth.api.getSession({ headers });
      return session ? { user: { id: session.user.id } } : null;
    })
  )
);

async function authRequest(path: string, body?: object, cookie?: string) {
  return app.request(`/api/auth/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      origin: "http://localhost:8081",
      ...(body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test("supports signup, valid and invalid login, session, protected bookings, and logout", async () => {
  const email = `auth-test-${crypto.randomUUID()}@example.com`;
  const password = "a-strong-test-password";
  const signup = await authRequest("sign-up/email", {
    name: "Test Customer",
    email,
    password,
  });
  assert.equal(signup.status, 200);
  const signupData = await signup.json();
  assert.equal(signupData.user.email, email);
  assert.equal(typeof signupData.user.id, "string");
  assert.equal(typeof signupData.token, "string");

  const duplicateSignup = await authRequest("sign-up/email", {
    name: "Test Customer",
    email,
    password,
  });
  assert.equal(duplicateSignup.status, 422);

  const invalidLogin = await authRequest("sign-in/email", {
    email,
    password: "incorrect-password",
  });
  assert.equal(invalidLogin.status, 401);

  const login = await authRequest("sign-in/email", { email, password });
  assert.equal(login.status, 200);
  const loginData = await login.json();
  assert.equal(loginData.user.email, email);
  assert.equal(loginData.user.id, signupData.user.id);
  assert.equal(typeof loginData.token, "string");
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);

  const currentUser = await authRequest("get-session", undefined, cookie);
  assert.equal(currentUser.status, 200);
  assert.equal((await currentUser.json()).user.email, email);

  const bookings = await app.request("/bookings", { headers: { cookie } });
  assert.equal(bookings.status, 200);

  const logout = await authRequest("sign-out", {}, cookie);
  assert.equal(logout.status, 200);

  const sessionAfterLogout = await authRequest(
    "get-session",
    undefined,
    cookie
  );
  assert.equal(sessionAfterLogout.status, 200);
  assert.equal(await sessionAfterLogout.json(), null);

  const afterLogout = await app.request("/bookings", { headers: { cookie } });
  assert.equal(afterLogout.status, 401);
});

test("rejects malformed auth JSON with a controlled client error", async () => {
  const response = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    headers: {
      origin: "http://localhost:8081",
      "content-type": "application/json",
    },
    body: "{",
  });

  assert.ok(response.status >= 400 && response.status < 500);
});

test("rejects missing auth fields with a controlled client error", async () => {
  const response = await authRequest("sign-in/email", {});
  assert.ok(response.status >= 400 && response.status < 500);
});

test("rejects protected bookings without a session or with an invalid session", async () => {
  for (const cookie of [undefined, "better-auth.session_token=invalid"]) {
    const response = await app.request("/bookings", {
      headers: cookie ? { cookie } : {},
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      success: false,
      message: "Authentication required",
    });
  }
});

test("authenticates GET /bookings before customer onboarding lookup", async () => {
  const email = `onboarding-${crypto.randomUUID()}@example.com`;
  const password = "a-strong-test-password";
  const signup = await authRequest("sign-up/email", {
    name: "Onboarding Test",
    email,
    password,
  });
  assert.equal(signup.status, 200);

  const login = await authRequest("sign-in/email", { email, password });
  assert.equal(login.status, 200);
  const loginData = await login.json();
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);

  const lookupsBeforeUnauthenticatedRequest = customerLookupCount;
  const unauthenticated = await app.request("/bookings");
  assert.equal(unauthenticated.status, 401);
  assert.deepEqual(await unauthenticated.json(), {
    success: false,
    message: "Authentication required",
  });
  assert.equal(customerLookupCount, lookupsBeforeUnauthenticatedRequest);

  usersWithoutCustomer.add(loginData.user.id);
  const authenticatedWithoutCustomer = await app.request("/bookings", {
    headers: { cookie },
  });
  assert.equal(authenticatedWithoutCustomer.status, 409);
  assert.deepEqual(await authenticatedWithoutCustomer.json(), {
    success: false,
    message: "Customer onboarding is required",
  });
  assert.equal(customerLookupCount, lookupsBeforeUnauthenticatedRequest + 1);
});

test("rejects a real expired session", async () => {
  const email = `expired-${crypto.randomUUID()}@example.com`;
  const password = "a-strong-test-password";
  assert.equal(
    (
      await authRequest("sign-up/email", {
        name: "Expired Session Test",
        email,
        password,
      })
    ).status,
    200
  );

  const login = await authRequest("sign-in/email", { email, password });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);

  for (const session of authStore.session) {
    session.expiresAt = new Date(0);
  }

  const response = await app.request("/bookings", { headers: { cookie } });
  assert.equal(response.status, 401);
});

test("blocks user B from user A's private booking", async () => {
  const users = [
    { email: `owner-${crypto.randomUUID()}@example.com`, name: "Owner" },
    { email: `other-${crypto.randomUUID()}@example.com`, name: "Other" },
  ];
  const password = "a-strong-test-password";
  const sessions: string[] = [];
  const userIds: string[] = [];

  for (const user of users) {
    assert.equal(
      (
        await authRequest("sign-up/email", {
          ...user,
          password,
        })
      ).status,
      200
    );
    const login = await authRequest("sign-in/email", {
      email: user.email,
      password,
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie);
    sessions.push(cookie);

    const sessionResponse = await authRequest(
      "get-session",
      undefined,
      cookie
    );
    const session = await sessionResponse.json();
    userIds.push(session.user.id);
  }

  const bookingId = "owner-private-booking";
  const ownerCustomerId = `customer-for-${userIds[0]}`;
  bookingOwners.set(bookingId, ownerCustomerId);

  const ownerResponse = await app.request(`/bookings/${bookingId}`, {
    headers: { cookie: sessions[0] },
  });
  assert.equal(ownerResponse.status, 200);

  const otherResponse = await app.request(`/bookings/${bookingId}`, {
    headers: { cookie: sessions[1] },
  });
  assert.equal(otherResponse.status, 404);
});
