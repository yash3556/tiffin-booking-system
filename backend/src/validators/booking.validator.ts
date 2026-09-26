export const bookingStatuses = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
] as const;

export type BookingStatusValue = (typeof bookingStatuses)[number];
const bookingStatusSet = new Set<string>(bookingStatuses);

export function isBookingStatus(
  status: unknown
): status is BookingStatusValue {
  return (
    typeof status === "string" &&
    bookingStatusSet.has(status)
  );
}

export function validateBooking(body: unknown) {
  if (!body || typeof body !== "object") {
    return "Request body is required";
  }

  const booking = body as Record<string, unknown>;

  if (
    typeof booking.customerId !== "string" ||
    booking.customerId.trim() === ""
  ) {
    return "Valid customerId is required";
  }

  if (
    typeof booking.serviceId !== "string" ||
    booking.serviceId.trim() === ""
  ) {
    return "Valid serviceId is required";
  }

  return null;
}

export function validateBookingStatus(body: unknown) {
  if (!body || typeof body !== "object") {
    return "Request body is required";
  }

  const status = (body as Record<string, unknown>).status;

  if (!isBookingStatus(status)) {
    return "Invalid booking status";
  }

  return null;
}