import { prisma } from "../lib/prisma.js";

export async function createTransaction(
  bookingId: string,
  amount: number
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  return prisma.transaction.create({
    data: {
      bookingId,
      amount,
      status: "SUCCESS",
    },
  });
}