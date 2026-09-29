```
npm install
npm run dev
```

```
open http://localhost:3000
```

## Authentication

Configure `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` before
starting the backend. Apply the Prisma migrations with `npx prisma migrate
deploy` from this directory. `CLIENT_ORIGINS` is a comma-separated list of
frontend origins; `EXPO_APP_SCHEME` defaults to `frontend`.

The Better Auth email/password endpoints are:

- `POST /api/auth/sign-up/email` with `{ "name", "email", "password" }`
- `POST /api/auth/sign-in/email` with `{ "email", "password" }`
- `GET /api/auth/get-session`
- `POST /api/auth/sign-out`

Successful signup/login sets the Better Auth session cookie. Send it on
subsequent requests using `credentials: "include"` (web) or the stored Expo
cookie. `GET /customers/me` returns the linked customer profile. After signup,
create that profile with `POST /customers` and `{ "name", "phone" }`.

Bookings, booking history, transactions, and customer endpoints require a
session. Missing, invalid, or expired sessions return `401` with
`{ "success": false, "message": "Authentication required" }`. Requests for a
booking or transaction not owned by the signed-in customer return `404`.

Run the focused auth and booking authorization tests with `npm test`; run the
backend type check with `npm run build`.
