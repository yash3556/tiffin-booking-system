import { prisma } from "../lib/prisma.js";
import { PaymentError } from "./payment-error.js";
import { getPaymentProvider } from "./payment-provider.js";
import {
  applyAuthorizedPayment,
  applyCapturedPayment,
  applyFailedPayment,
} from "./payment-state.service.js";

export { PaymentError } from "./payment-error.js";

export async function initiatePayment(
  bookingId: string,
  customerId: string,
  idempotencyKey: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });
  if (!booking) {
    throw new PaymentError("Booking not found", 404);
  }
  if (booking.customerId !== customerId) {
    throw new PaymentError("Forbidden", 403);
  }
  const provider = getPaymentProvider();

  const existing = await prisma.transaction.findUnique({
    where: { idempotencyKey },
  });
  if (existing) {
    if (existing.bookingId !== bookingId) {
      throw new PaymentError(
        "Idempotency-Key was used for another booking",
        409
      );
    }
    if (!existing.razorpayOrderId) {
      if (existing.status === "CREATING_ORDER") {
        return {
          transaction: existing,
          keyId: provider.getKeyId(),
          created: false,
          processing: true,
        };
      }
      throw new PaymentError(
        "Payment order is being reconciled; retry later",
        409
      );
    }
    return {
      transaction: existing,
      keyId: provider.getKeyId(),
      ...(existing.razorpayOrderId && provider.getMockPaymentDetails
        ? {
            mockPayment: provider.getMockPaymentDetails({
              orderId: existing.razorpayOrderId,
              amount: existing.amount * 100,
              currency: existing.currency,
            }),
          }
        : {}),
      created: false,
      processing: false,
    };
  }
  if (booking.status !== "PENDING") {
    throw new PaymentError("Booking is not payable", 409);
  }

  const amount = booking.service.price * 100;
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new PaymentError("Booking has an invalid service price", 409);
  }
  const keyId = provider.getKeyId();

  let transaction;
  try {
    transaction = await prisma.$transaction(async (tx) => {
      const activeAttempt = await tx.transaction.findFirst({
        where: {
          bookingId,
          status: {
            in: [
              "CREATING_ORDER",
              "PENDING",
              "AUTHORIZED",
              "RECONCILIATION_REQUIRED",
            ],
          },
        },
      });
      if (activeAttempt) {
        throw new PaymentError("A payment attempt is already active", 409);
      }
      return tx.transaction.create({
        data: {
          bookingId,
          amount: booking.service.price,
          currency: "INR",
          idempotencyKey,
          status: "CREATING_ORDER",
        },
      });
    });
  } catch (error) {
    const attemptConflict =
      error instanceof PaymentError && error.statusCode === 409;
    if (!isUniqueConstraintError(error) && !attemptConflict) {
      throw error;
    }
    const replay = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });
    if (replay?.bookingId === bookingId) {
      if (replay.razorpayOrderId) {
        return {
          transaction: replay,
          keyId: provider.getKeyId(),
          ...(provider.getMockPaymentDetails
            ? {
                mockPayment: provider.getMockPaymentDetails({
                  orderId: replay.razorpayOrderId,
                  amount: replay.amount * 100,
                  currency: replay.currency,
                }),
              }
            : {}),
          created: false,
          processing: false,
        };
      }
      if (replay.status === "CREATING_ORDER") {
        return {
          transaction: replay,
          keyId: provider.getKeyId(),
          created: false,
          processing: true,
        };
      }
    }
    if (attemptConflict) {
      throw error;
    }
    throw new PaymentError("A payment attempt is already active", 409);
  }

  try {
    const order = await provider.createOrder({
      amount,
      currency: "INR",
      receipt: transaction.id,
      notes: { transactionId: transaction.id, bookingId },
    });
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: { razorpayOrderId: order.id, status: "PENDING" },
    });
    return {
      transaction: updatedTransaction,
      keyId,
      ...(order.mockPayment ? { mockPayment: order.mockPayment } : {}),
      created: true,
      processing: false,
    };
  } catch (error) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "RECONCILIATION_REQUIRED" },
    });
    console.error("Could not create Razorpay order", error);
    throw new PaymentError("Payment order could not be confirmed", 503);
  }
}

export async function verifyPayment(
  transactionId: string,
  customerId: string,
  orderId: string,
  paymentId: string,
  signature: string
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { booking: { select: { customerId: true } } },
  });
  if (!transaction) {
    throw new PaymentError("Transaction not found", 404);
  }
  if (transaction.booking.customerId !== customerId) {
    throw new PaymentError("Forbidden", 403);
  }
  if (transaction.razorpayOrderId !== orderId) {
    throw new PaymentError("Razorpay order does not match", 400);
  }
  if (
    transaction.razorpayPaymentId &&
    transaction.razorpayPaymentId !== paymentId
  ) {
    throw new PaymentError("Transaction is linked to another payment", 409);
  }
  const provider = getPaymentProvider();
  if (!provider.verifyCheckoutSignature(orderId, paymentId, signature)) {
    throw new PaymentError("Invalid Razorpay payment signature", 400);
  }
  if (transaction.status === "SUCCESS") {
    return transaction;
  }

  let payment;
  try {
    payment = await provider.fetchPayment(paymentId, {
      orderId,
      amount: transaction.amount * 100,
      currency: transaction.currency,
    });
  } catch (error) {
    console.error("Could not verify Razorpay payment", error);
    throw new PaymentError("Payment status is temporarily unavailable", 503);
  }
  if (
    payment.id !== paymentId ||
    payment.order_id !== orderId ||
    Number(payment.amount) !== transaction.amount * 100 ||
    payment.currency !== transaction.currency
  ) {
    throw new PaymentError("Razorpay payment details do not match", 400);
  }

  if (payment.status === "captured" && payment.captured) {
    return prisma.$transaction((tx) =>
      applyCapturedPayment(tx, transaction.id, paymentId)
    );
  }
  if (payment.status === "authorized") {
    return prisma.$transaction((tx) =>
      applyAuthorizedPayment(tx, transaction.id, paymentId)
    );
  }
  if (payment.status === "failed") {
    return prisma.$transaction((tx) =>
      applyFailedPayment(tx, orderId, paymentId)
    );
  }
  return transaction;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
