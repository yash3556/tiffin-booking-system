# Tiffin Hub — Frontend

Frontend application for **Tiffin Hub**, a subscription meal and micro-delivery platform.

Built with **Expo, React Native, TypeScript, and Expo Router**.

## Features

- User signup and login
- Authentication and session handling
- Customer onboarding
- Service listing
- Service details
- Service booking
- Booking confirmation
- Booking status tracking
- Booking status history
- Transaction history
- Loading, error, and empty states
- Web support
- Android testing with Expo Go

## Tech Stack

- **Expo SDK 57**
- **React 19.2.3**
- **React Native 0.86.3**
- **TypeScript ~6.0.3**
- **Expo Router ~57.0.23**
- **Better Auth ^1.7.6**
- **@better-auth/expo ^1.7.6**
- **Expo Secure Store**
- **React Native Web**

## Project Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx
│   │   │   └── history.tsx
│   │   ├── booking/
│   │   │   └── [id]/
│   │   │       ├── confirmation.tsx
│   │   │       └── status.tsx
│   │   ├── book/
│   │   │   └── [serviceId].tsx
│   │   ├── services/
│   │   │   └── [id].tsx
│   │   ├── customer-onboarding.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── _layout.tsx
│   │
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── styles/
│   └── types/
│
├── assets/
├── .env
├── package.json
├── tsconfig.json
└── README.md
Application Flow
Signup / Login
      ↓
Authentication
      ↓
Customer Onboarding
      ↓
Services
      ↓
Service Details
      ↓
Booking
      ↓
Booking Confirmation
      ↓
Booking Status
      ↓
History
API Architecture

The frontend separates UI screens from backend communication.

Screen
  ↓
Feature Service
  ↓
API Layer
  ↓
Backend API
  ↓
Response
  ↓
UI State

The central API layer is:

src/services/api.ts

Feature-specific API services are:

src/services/customerService.ts
src/services/serviceService.ts
src/services/bookingService.ts
src/services/transactionService.ts
API Endpoints
Customers
POST /customers

Used during customer onboarding.

Services
GET /services

Used to retrieve available services.

Bookings
POST /bookings
GET /bookings/:id
PATCH /bookings/:id/status
GET /bookings/:id/history
Transactions
GET /transactions

Transaction creation belongs to the payment flow and should not be triggered simply because a booking reaches COMPLETED.

Booking Status

The frontend supports:

PENDING
CONFIRMED
CANCELLED
COMPLETED

Current booking flow:

PENDING → CONFIRMED → COMPLETED
PENDING → CANCELLED
Authentication

Authentication is handled using Better Auth.

Authentication configuration:

src/lib/auth-client.ts

Route protection and session handling:

src/app/_layout.tsx

Native authentication storage uses Expo Secure Store.

Customer Onboarding

Authenticated customers can complete their profile by providing:

Name
Phone number

Screen:

src/app/customer-onboarding.tsx

Customer API:

src/services/customerService.ts
Environment Configuration

Create a .env file inside the frontend directory:

EXPO_PUBLIC_API_URL=http://localhost:3000

The variable defines the backend API base URL for local development.

Do not commit passwords, authentication tokens, API keys, or other secrets.

Getting Started
1. Clone the repository
git clone https://github.com/yash3556/tiffin-booking-system.git
2. Open the frontend
cd tiffin-booking-system/frontend
3. Install dependencies
npm install
4. Configure the environment

Create .env:

EXPO_PUBLIC_API_URL=http://localhost:3000
5. Start the application
npx expo start

For web:

npm run web

For Android testing, open the project with Expo Go.

Development Checks

Run TypeScript validation:

npx tsc --noEmit

Check the Git diff for formatting and whitespace issues:

git diff --check
Payment Integration

Payment integration is dependent on the backend payment API contract.

Transactions should be created as part of the payment flow rather than automatically when a booking is marked COMPLETED.

The frontend will integrate the payment flow once the backend payment endpoint and request/response contract are finalized.

Project Status
Completed
Authentication
Customer onboarding
Services listing
Service details
Booking flow
Booking confirmation
Booking status
Booking status history
Transaction history
Loading states
Error states
Empty states
API integration
Web support
Pending
Final payment integration based on the backend payment API
Final UI refinements based on the approved Figma/design handoff
Repository

GitHub: https://github.com/yash3556/tiffin-booking-system