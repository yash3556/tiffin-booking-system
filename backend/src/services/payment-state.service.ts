import type { Prisma } from "../../generated/prisma/client.js";
import { PaymentError } from "./payment-error.js";

export async function applyCapturedPayment(
  tx: Prisma.TransactionClient,
  transactionId: string,
  paymentId: string
) {
  const attempt = await tx.transaction.findUnique({
    where: { id: transactionId },
    include: { booking: true },
  });
  if (!attempt) {
    throw new PaymentError("Transaction not found", 404);
  }
  if (attempt.status === "SUCCESS") {
    if (attempt.razorpayPaymentId !== paymentId) {
      throw new PaymentError(
        "A second captured payment requires reconciliation",
        409
      );
    }
    return attempt;
  }
  if (attempt.razorpayPaymentId && attempt.razorpayPaymentId !== paymentId) {
    throw new PaymentError("Transaction is linked to another payment", 409);
  }
  if (attempt.booking.status !== "PENDING") {
    await tx.transaction.updateMany({
      where: {
        id: transactionId,
        status: { not: "SUCCESS" },
        OR: [{ razorpayPaymentId: null }, { razorpayPaymentId: paymentId }],
      },
      data: {
        razorpayPaymentId: paymentId,
        status: "RECONCILIATION_REQUIRED",
      },
    });
    return tx.transaction.findUniqueOrThrow({ where: { id: transactionId } });
  }

  const bookingUpdate = await tx.booking.updateMany({
    where: { id: attempt.bookingId, status: "PENDING" },
    data: { status: "CONFIRMED" },
  });
  if (bookingUpdate.count !== 1) {
    await tx.transaction.updateMany({
      where: {
        id: transactionId,
        status: { not: "SUCCESS" },
        OR: [{ razorpayPaymentId: null }, { razorpayPaymentId: paymentId }],
      },
      data: {
        razorpayPaymentId: paymentId,
        status: "RECONCILIATION_REQUIRED",
      },
    });
    return tx.transaction.findUniqueOrThrow({ where: { id: transactionId } });
  }
  const updatedCount = await tx.transaction.updateMany({
    where: {
      id: transactionId,
      status: { not: "SUCCESS" },
      OR: [{ razorpayPaymentId: null }, { razorpayPaymentId: paymentId }],
    },
    data: { razorpayPaymentId: paymentId, status: "SUCCESS" },
  });
  const updated = await tx.transaction.findUniqueOrThrow({
    where: { id: transactionId },
  });
  if (updatedCount.count !== 1) {
    if (updated.status === "SUCCESS" && updated.razorpayPaymentId === paymentId) {
      return updated;
    }
    throw new PaymentError("Transaction changed during payment processing", 409);
  }
  await tx.bookingHistory.create({
    data: {
      bookingId: attempt.bookingId,
      fromStatus: "PENDING",
      toStatus: "CONFIRMED",
    },
  });
  return updated;
}

export async function applyAuthorizedPayment(
  tx: Prisma.TransactionClient,
  transactionId: string,
  paymentId: string
) {
  await tx.transaction.updateMany({
    where: {
      id: transactionId,
      status: { not: "SUCCESS" },
      OR: [{ razorpayPaymentId: null }, { razorpayPaymentId: paymentId }],
    },
    data: { razorpayPaymentId: paymentId, status: "AUTHORIZED" },
  });
  const updated = await tx.transaction.findUniqueOrThrow({
    where: { id: transactionId },
  });
  if (updated.razorpayPaymentId !== paymentId) {
    throw new PaymentError("Transaction is linked to another payment", 409);
  }
  return updated;
}

export async function applyFailedPayment(
  tx: Prisma.TransactionClient,
  orderId: string,
  paymentId: string
) {
  const attempt = await tx.transaction.findUnique({
    where: { razorpayOrderId: orderId },
  });
  if (!attempt || attempt.status === "SUCCESS") {
    return attempt;
  }
  if (attempt.razorpayPaymentId && attempt.razorpayPaymentId !== paymentId) {
    throw new PaymentError("Transaction is linked to another payment", 409);
  }
  await tx.transaction.updateMany({
    where: {
      id: attempt.id,
      status: { not: "SUCCESS" },
      OR: [{ razorpayPaymentId: null }, { razorpayPaymentId: paymentId }],
    },
    data: { razorpayPaymentId: paymentId, status: "FAILED" },
  });
  const updated = await tx.transaction.findUniqueOrThrow({
    where: { id: attempt.id },
  });
  if (updated.razorpayPaymentId !== paymentId) {
    throw new PaymentError("Transaction is linked to another payment", 409);
  }
  return updated;
}
