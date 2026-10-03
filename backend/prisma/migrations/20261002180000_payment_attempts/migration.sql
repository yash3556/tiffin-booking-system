ALTER TYPE "TransactionStatus" ADD VALUE 'CREATING_ORDER';
ALTER TYPE "TransactionStatus" ADD VALUE 'AUTHORIZED';
ALTER TYPE "TransactionStatus" ADD VALUE 'RECONCILIATION_REQUIRED';

ALTER TABLE "Transaction"
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "razorpayOrderId" TEXT,
  ADD COLUMN "razorpayPaymentId" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Transaction_razorpayOrderId_key"
  ON "Transaction"("razorpayOrderId");

CREATE UNIQUE INDEX "Transaction_razorpayPaymentId_key"
  ON "Transaction"("razorpayPaymentId");

CREATE UNIQUE INDEX "Transaction_bookingId_idempotencyKey_key"
  ON "Transaction"("bookingId", "idempotencyKey");

ALTER TABLE "Transaction" ALTER COLUMN "updatedAt" DROP DEFAULT;
