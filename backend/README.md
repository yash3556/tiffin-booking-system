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

For Razorpay Test Mode, configure `RAZORPAY_KEY_ID`,
`RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in the backend environment.
Never use live-mode credentials during Day 6 development.

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

## Razorpay Test Mode Payments

Day 6 payment work uses Razorpay Test Mode only. Configure `RAZORPAY_KEY_ID`,
`RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` alongside the existing
backend variables. The key ID is returned for Checkout; the key secret and
webhook secret are server-only. Configure the Test Mode webhook URL as
`POST /webhooks/razorpay` and subscribe to `payment.captured` and
`payment.failed`.

Start an attempt with authenticated `POST /transactions`, a JSON body
`{ "bookingId": "..." }`, and an `Idempotency-Key` header. The server checks
booking ownership and status, then derives the price from `Service.price`.
Service and local transaction amounts are whole INR rupees; the server
converts the amount to paise when creating a Razorpay Order. The response
contains the local attempt, Razorpay order ID, and public key ID. Do not send
an amount, customer/user ID, or status from the client.

After Checkout, send `razorpay_order_id`, `razorpay_payment_id`, and
`razorpay_signature` to `POST /transactions/:id/verify`. The server checks the
signature, fetches the payment from Razorpay, and only confirms the booking
when Razorpay reports the matching payment as captured. Webhooks use the raw
request-body signature and Razorpay event ID for verification and deduplication.
Failed attempts remain separate from retries; retry with a new
`Idempotency-Key`. Reusing a key returns the existing attempt, while an
unresolved order-creation attempt requires reconciliation rather than another
order.

Only a captured payment for a `PENDING` booking changes it to `CONFIRMED`, in
the same database transaction that records `BookingHistory`. Payment attempts
for `CANCELLED` or `COMPLETED` bookings are rejected. A late captured payment
for a booking that is no longer pending is recorded as
`RECONCILIATION_REQUIRED`; it does not reopen the booking or issue a refund.

The payment migrations preserve existing transaction statuses and amounts.
Existing `SUCCESS` rows remain legacy records without Razorpay order/payment
evidence; they must not be treated as provider-verified payments. New
transaction amounts are persisted as whole INR rupees, matching the existing
service-price and UI convention, while Razorpay receives paise.
The retry-integrity migration stops with an explicit error rather than
silently resolving any pre-existing booking with multiple active attempts.

### Local mock payments

Use the mock provider to exercise the existing transaction and verification
flow locally without connecting to Razorpay.

For local testing without Razorpay credentials, set
`PAYMENT_PROVIDER=mock` and `MOCK_PAYMENT_SECRET=local-mock-secret`. The mock
provider is disabled when `NODE_ENV=production`; it does not use or relax
Razorpay credential validation. If `PAYMENT_PROVIDER` is unset, the existing
Razorpay provider remains the default.

The normal `POST /transactions` endpoint and `Idempotency-Key` behavior are
unchanged. In mock mode, its response additionally includes a `mockPayment`
object with a deterministic `mock_order_<transaction-id>`, matching
`mock_payment_<transaction-id>`, amount in paise, currency, captured status,
and a local HMAC-SHA256 signature. Submit those order ID, payment ID, and
signature values to the existing `/transactions/:id/verify` endpoint; the
usual captured-payment state transition confirms the booking and adds booking
history. Keep the mock secret local and never reuse it as a Razorpay secret.

#### Postman smoke test

Use a signed-in customer's session cookie and an existing `PENDING` booking
owned by that customer. Set `{{baseUrl}}` to `http://localhost:3000`, and
`{{bookingId}}` to that booking's ID. Send the session cookie on every request.

1. **Create a mock transaction**

   `POST {{baseUrl}}/transactions`

   Headers: `Content-Type: application/json`,
   `Cookie: {{customerSessionCookie}}`,
   `Idempotency-Key: {{idempotencyKey}}`

   Body:
   ```json
   { "bookingId": "{{bookingId}}" }
   ```

   Expected: `201 Created`; `data.status` is `PENDING`,
   `data.razorpayOrderId` starts with `mock_order_`, and `data.mockPayment`
   contains `orderId`, `paymentId`, `amount`, `currency`, `status`, and
   `signature`. Save `data.id` as `{{transactionId}}` and save the three
   verification values from `data.mockPayment`.

2. **Replay with the same idempotency key**

   Repeat the same method, URL, headers, and body without changing
   `Idempotency-Key`.

   Expected: `200 OK`; the transaction/order IDs and mock verification values
   are the same as in step 1.

3. **Reject reuse of the key for a different booking**

   Repeat the create request with the same key but another booking ID owned by
   the same customer.

   Expected: `409 Conflict` with `{ "success": false, "message": "Idempotency-Key was used for another booking" }`.

4. **Reject an invalid signature**

   `POST {{baseUrl}}/transactions/{{transactionId}}/verify`

   Headers: `Content-Type: application/json`,
   `Cookie: {{customerSessionCookie}}`

   Body:
   ```json
   {
     "razorpay_order_id": "{{mockOrderId}}",
     "razorpay_payment_id": "{{mockPaymentId}}",
     "razorpay_signature": "invalid"
   }
   ```

   Expected: `400 Bad Request`; the message is `Invalid Razorpay payment signature`.

5. **Verify the successful mock payment**

   Send the same request as step 4, replacing the signature with
   `{{mockSignature}}` copied from step 1's `data.mockPayment.signature`.

   Expected: `200 OK`; `data.status` is `SUCCESS` and
   `data.razorpayPaymentId` equals `{{mockPaymentId}}`.

6. **Check transaction and booking state**

   `GET {{baseUrl}}/transactions/{{transactionId}}` should return `200 OK`
   with `data.status: "SUCCESS"`.
   `GET {{baseUrl}}/bookings/{{bookingId}}` should return `200 OK` with
   `data.status: "CONFIRMED"`.
   `GET {{baseUrl}}/bookings/{{bookingId}}/history` should return `200 OK`
   with an entry whose `fromStatus` is `PENDING` and `toStatus` is
   `CONFIRMED`.

7. **Check authorization**

   Repeat step 1 without a `Cookie` header: expected `401 Unauthorized`.
   Repeat step 1 with another customer's session cookie but the original
   customer's booking ID: expected `403 Forbidden`.
