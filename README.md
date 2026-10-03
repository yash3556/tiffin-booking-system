# Tiffin Booking System

A full-stack tiffin booking system developed as part of the internship project.

The system provides customer management, service management, booking management, transaction/payment processing, authentication, payment state management, and webhook-based payment handling.

---

# Backend

## Backend Overview

The backend is responsible for:

* Authentication
* Customer management
* Service management
* Booking management
* Booking history
* Transaction management
* Payment processing
* Payment state management
* Idempotency
* Payment provider abstraction
* Razorpay integration structure
* Webhook handling
* Error handling
* Database persistence
* Authorization
* API validation

---

## Tech Stack

* Node.js
* TypeScript
* Hono
* Prisma
* PostgreSQL / Neon
* Better Auth
* Razorpay integration structure
* Docker
* REST APIs

---

## Backend Structure

```text
backend/
├── src/
│   ├── index.ts
│   ├── lib/
│   │   ├── razorpay.ts
│   │   └── razorpay.test.ts
│   │
│   ├── routes/
│   │   ├── booking.routes.ts
│   │   ├── transaction.routes.ts
│   │   ├── razorpay-webhook.routes.ts
│   │   └── *.authorization.test.ts
│   │
│   ├── services/
│   │   ├── booking.service.ts
│   │   ├── transaction.service.ts
│   │   ├── payment.service.ts
│   │   ├── payment-provider.ts
│   │   ├── mock-payment-provider.ts
│   │   ├── razorpay-payment-provider.ts
│   │   ├── payment-state.service.ts
│   │   ├── payment-error.ts
│   │   └── razorpay-webhook.service.ts
│   │
│   └── validators/
│       └── transaction.validator.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
└── generated/
    └── prisma/
```

---

# Environment

Create the required environment configuration according to the project's environment setup.

Never commit secrets to GitHub.

Sensitive values include:

```text
DATABASE_URL
BETTER_AUTH_SECRET
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
```

---

# Running the Backend

From the backend directory:

```powershell
cd backend
npm install
npm run dev
```

Local server:

```text
http://localhost:3000
```

---

# Database

The project uses Prisma with PostgreSQL/Neon.

Generate Prisma Client:

```powershell
npx prisma generate
```

For development database migrations:

```powershell
npx prisma migrate dev
```

---

# Authentication

Authentication is implemented using Better Auth.

The backend supports:

* Signup
* Login
* Session handling
* Logout
* Protected routes
* Authenticated user context
* Authorization checks

Authentication should be treated separately from authorization.

Authentication answers:

```text
Who is the user?
```

Authorization answers:

```text
Is this user allowed to perform this operation?
```

---

# Booking System

Core booking flow:

```text
Customer
   ↓
Service
   ↓
Booking
   ↓
Booking History
   ↓
Transaction
   ↓
Payment
```

Booking states include:

```text
PENDING
CONFIRMED
CANCELLED
COMPLETED
```

Booking history records state changes for traceability.

---

# Transaction System

The transaction system maintains payment-related information associated with bookings.

Transaction statuses:

```text
CREATING_ORDER
PENDING
AUTHORIZED
SUCCESS
FAILED
RECONCILIATION_REQUIRED
```

Transaction information includes:

```text
Transaction ID
Booking ID
Amount
Currency
Idempotency Key
Razorpay Order ID
Razorpay Payment ID
Status
Created At
Updated At
```

---

# Payment Architecture

Payment processing uses a provider abstraction.

Conceptually:

```text
Payment Service
      ↓
Payment Provider Interface
      ↓
 ┌───────────────┐
 │               │
Mock Provider   Razorpay Provider
```

This allows development/testing without coupling the complete application directly to one payment implementation.

---

# Day 6 Payment Implementation

Day 6 introduced:

* Payment provider abstraction
* Mock payment provider
* Razorpay payment provider structure
* Payment service
* Payment state service
* Payment errors
* Payment idempotency
* Payment attempt handling
* Razorpay webhook handling
* Webhook event persistence
* Payment reconciliation support
* Transaction state management
* Frontend transaction status support

---

# Important Testing Note

The current Day 6 implementation uses a **mock payment provider / mock credentials for development and integration testing**.

It should **not be considered a completed real Razorpay Test Mode payment integration**.

The architecture contains Razorpay integration support, but real Razorpay Test Mode credentials should be configured separately when the integration environment is ready.

Never commit real credentials to the repository.

---

# Payment Idempotency

Payment operations use idempotency to prevent accidental duplicate payment processing.

Example:

```text
payment-test-001
```

The backend uses the idempotency key to identify repeated requests for the same payment operation.

---

# Webhooks

The backend includes Razorpay webhook handling infrastructure.

Webhook responsibilities include:

* Receiving payment events
* Validating/processing webhook information
* Updating payment state
* Persisting webhook events
* Supporting reconciliation
* Preventing inconsistent transaction states

Webhook secrets must remain server-side.

---

# Error Handling

The backend provides structured error handling for scenarios such as:

```text
Invalid request
Authentication failure
Authorization failure
Invalid payment state
Duplicate payment request
Payment failure
Webhook failure
Database errors
```

Frontend applications should use backend error responses rather than assuming every request is successful.

---

# Security

The backend follows these principles:

* Secrets remain server-side.
* Authentication is required for protected operations.
* Authorization is checked at the API/service level.
* Payment state is controlled by the backend.
* Idempotency is used for payment operations.
* Webhook processing is handled server-side.
* Database operations use Prisma.
* Sensitive environment variables are not committed.

---

# Testing

Payment-related test files include:

```text
src/lib/razorpay.test.ts

src/services/mock-payment-provider.test.ts

src/routes/booking.authorization.test.ts

src/routes/transaction.authorization.test.ts

src/routes/razorpay-webhook.authorization.test.ts
```

Run the project's configured test command:

```powershell
npm test
```

If the project uses a different test script, check:

```powershell
npm run
```

---

# Frontend Integration

Frontend developers should use the backend API as the source of truth for:

```text
Booking state
Transaction state
Payment state
Payment errors
```

The frontend must support:

```text
CREATING_ORDER
PENDING
AUTHORIZED
SUCCESS
FAILED
RECONCILIATION_REQUIRED
```

Frontend should never contain:

```text
Database credentials
Payment secret
Webhook secret
Backend authentication secret
```

---

# Development Workflow

Recommended workflow:

```text
1. Pull latest main
2. Install dependencies
3. Configure environment
4. Generate Prisma Client
5. Run database migrations when required
6. Start backend
7. Start frontend
8. Test API flow
9. Test frontend integration
10. Run tests
11. Review git diff
12. Commit changes
13. Pull/rebase latest main
14. Push changes
```

---

# Git

Check repository state:

```powershell
git status
```

Review changes:

```powershell
git diff
```

Stage specific files:

```powershell
git add <file>
```

Commit:

```powershell
git commit -m "your message"
```

Before pushing:

```powershell
git pull --rebase origin main
```

Then:

```powershell
git push origin main
```

Avoid force pushing to `main` unless explicitly authorized.

---

# Current Backend Development Status

The backend currently contains the foundation for:

```text
Authentication             ✅
Customer management        ✅
Service management         ✅
Booking management         ✅
Booking history            ✅
Transactions               ✅
Payment abstraction        ✅
Mock payment provider      ✅
Payment state handling     ✅
Idempotency                ✅
Razorpay integration       🟡 Development structure
Razorpay webhooks          🟡 Development/testing
Real Razorpay Test Mode    ⏳ Not yet configured
Frontend integration       🟡 In progress
```

---

# Important

The repository is currently a development/internship implementation.

Before production deployment, payment credentials, webhook configuration, security configuration, production environment variables, monitoring, and complete end-to-end payment verification must be configured and tested separately.
