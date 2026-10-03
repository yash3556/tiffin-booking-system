DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Transaction"
    WHERE "status" IN (
      'CREATING_ORDER',
      'PENDING',
      'AUTHORIZED',
      'RECONCILIATION_REQUIRED'
    )
    GROUP BY "bookingId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Resolve multiple active payment attempts per booking before applying this migration';
  END IF;
END $$;

DROP INDEX "Transaction_bookingId_idempotencyKey_key";

CREATE UNIQUE INDEX "Transaction_idempotencyKey_key"
  ON "Transaction"("idempotencyKey");

CREATE UNIQUE INDEX "Transaction_one_active_attempt_per_booking_key"
  ON "Transaction"("bookingId")
  WHERE "status" IN (
    'CREATING_ORDER',
    'PENDING',
    'AUTHORIZED',
    'RECONCILIATION_REQUIRED'
  );
