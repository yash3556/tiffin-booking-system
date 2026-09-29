import { prisma } from "../lib/prisma.js";

export class TransactionError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 404
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
    where: { id: bookingId, customerId },
    select: { id: true },
  });
  if (!booking) {
    throw new TransactionError("Booking not found", 404);
  }

  return prisma.transaction.findMany({
    where: { bookingId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getTransaction(id: string, customerId: string) {
  return prisma.transaction.findFirst({
    where: {
      id,
      booking: { customerId },
    },
  });
}

export async function createTransaction(
  bookingId: string,
  amount: number,
  customerId: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, customerId },
  });

  if (!booking) {
    throw new TransactionError("Booking not found", 404);
  }

  return prisma.transaction.create({
    data: {
      bookingId,
      amount,
      status: "SUCCESS",
    },
  });
}