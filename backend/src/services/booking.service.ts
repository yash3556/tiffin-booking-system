import { prisma } from "../lib/prisma.js";
import type { BookingStatusValue } from "../validators/booking.validator.js";

export class BookingError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 400 | 404
  ) {
    super(message);
    this.name = "BookingError";
  }
}

const validTransitions: Record<BookingStatusValue, BookingStatusValue[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
};

export async function getBookingsForCustomer(customerId: string) {
  return prisma.booking.findMany({
    where: { customerId },
    include: {
      service: true,
      transactions: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createBooking(customerId: string, serviceId: string) {
  return prisma.$transaction(async (transaction) => {
    const customer = await transaction.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new BookingError("Customer not found", 404);
    }

    const service = await transaction.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new BookingError("Service not found", 404);
    }

    const booking = await transaction.booking.create({
      data: {
        customerId,
        serviceId,
        status: "PENDING",
      },
    });

    await transaction.bookingHistory.create({
      data: {
        bookingId: booking.id,
        fromStatus: null,
        toStatus: "PENDING",
      },
    });

    return booking;
  });
}

export async function getBooking(id: string, customerId: string) {
  return prisma.booking.findUnique({
    where: { id, customerId },
    include: {
      customer: true,
      service: true,
      transactions: true,
    },
  });
}

export async function updateBookingStatus(
  id: string,
  customerId: string,
  toStatus: BookingStatusValue
) {
  return prisma.$transaction(async (transaction) => {
    const booking = await transaction.booking.findUnique({
      where: { id, customerId },
    });

    if (!booking) {
      throw new BookingError("Booking not found", 404);
    }

    const fromStatus = booking.status as BookingStatusValue;

    if (!validTransitions[fromStatus].includes(toStatus)) {
      throw new BookingError(
        `Cannot change booking status from ${fromStatus} to ${toStatus}`,
        400
      );
    }

    const updatedBooking = await transaction.booking.update({
      where: { id },
      data: { status: toStatus },
    });

    await transaction.bookingHistory.create({
      data: {
        bookingId: id,
        fromStatus,
        toStatus,
      },
    });

    return updatedBooking;
  });
}

export async function getBookingHistory(id: string, customerId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id, customerId },
    select: { id: true },
  });

  if (!booking) {
    throw new BookingError("Booking not found", 404);
  }

  return prisma.bookingHistory.findMany({
    where: { bookingId: id },
    orderBy: { createdAt: "asc" },
  });
}