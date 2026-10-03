import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import {
  applyCapturedPayment,
  applyFailedPayment,
} from "./payment-state.service.js";

type PaymentEvent = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
};

export async function processRazorpayWebhook(
  eventId: string,
  body: unknown
) {
  const eventType = readEventType(body);
  const paymentEvent = readPaymentEvent(body, eventType);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.webhookEvent.create({
        data: {
          id: eventId,
          event: eventType,
          razorpayPaymentId: paymentEvent?.id,
          razorpayOrderId: paymentEvent?.order_id,
        },
      });
      if (!paymentEvent) {
        return;
      }

      const attempt = await tx.transaction.findUnique({
        where: { razorpayOrderId: paymentEvent.order_id },
      });
      if (!attempt) {
        console.error("Razorpay webhook references an unknown order");
        return;
      }
      if (
        paymentEvent.amount !== attempt.amount * 100 ||
        paymentEvent.currency !== attempt.currency
      ) {
        console.error("Razorpay webhook payment details do not match attempt");
        return;
      }

      if (eventType === "payment.captured") {
        if (
          attempt.status === "SUCCESS" &&
          attempt.razorpayPaymentId !== paymentEvent.id
        ) {
          console.error(
            "A second captured payment requires manual reconciliation",
            { eventId, transactionId: attempt.id }
          );
          return;
        }
        await applyCapturedPayment(tx, attempt.id, paymentEvent.id);
      } else {
        await applyFailedPayment(tx, paymentEvent.order_id, paymentEvent.id);
      }
    });
    return { duplicate: false };
  } catch (error) {
    const priorEvent = await prisma.webhookEvent.findUnique({
      where: { id: eventId },
    });
    if (priorEvent) {
      return { duplicate: true };
    }
    throw error;
  }
}

function readEventType(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Invalid Razorpay webhook body");
  }
  const root = body as Record<string, unknown>;
  if (typeof root.event !== "string" || root.event.length === 0) {
    throw new Error("Missing Razorpay webhook event type");
  }
  return root.event;
}

function readPaymentEvent(
  body: unknown,
  eventType: string
): PaymentEvent | null {
  const root = body as Record<string, unknown>;
  if (eventType !== "payment.captured" && eventType !== "payment.failed") {
    return null;
  }
  const payload = root.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid Razorpay payment event");
  }
  const payment = (payload as Record<string, unknown>).payment;
  if (!payment || typeof payment !== "object" || Array.isArray(payment)) {
    throw new Error("Invalid Razorpay payment event");
  }
  const entity = (payment as Record<string, unknown>).entity;
  if (!entity || typeof entity !== "object" || Array.isArray(entity)) {
    throw new Error("Invalid Razorpay payment entity");
  }
  const value = entity as Record<string, unknown>;
  if (
    typeof value.id !== "string" ||
    typeof value.order_id !== "string" ||
    typeof value.amount !== "number" ||
    typeof value.currency !== "string" ||
    value.status !== (eventType === "payment.captured" ? "captured" : "failed")
  ) {
    throw new Error("Invalid Razorpay payment entity");
  }
  return value as PaymentEvent;
}
