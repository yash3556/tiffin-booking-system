import { prisma } from "../lib/prisma.js";

export class TransactionError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 403 | 404
  ) {
    super(message);
    this.name = "TransactionError";
  }
}

export async function getTransactionsForCustomer(customerId: string) {
  return prisma.transaction.findMany({
    where: {
      booking: { customerId },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTransactionsForBooking(
  bookingId: string,
  customerId: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, customerId: true },
  });
  if (!booking) {
    throw new TransactionError("Booking not found", 404);
  }
  if (booking.customerId !== customerId) {
    throw new TransactionError("Forbidden", 403);
  }

  return prisma.transaction.findMany({
    where: { bookingId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getTransaction(id: string, customerId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    select: {
      id: true,
      booking: { select: { customerId: true } },
    },
  });
  if (!transaction) {
    return null;
  }
  if (transaction.booking.customerId !== customerId) {
    throw new TransactionError("Forbidden", 403);
  }

  return prisma.transaction.findUnique({ where: { id } });
}

export async function createTransaction(
  bookingId: string,
  amount: number,
  customerId: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, customerId: true },
  });

  if (!booking) {
    throw new TransactionError("Booking not found", 404);
  }
  if (booking.customerId !== customerId) {
    throw new TransactionError("Forbidden", 403);
  }

  return prisma.transaction.create({
    data: {
      bookingId,
      amount,
      status: "SUCCESS",
    },
  });
}