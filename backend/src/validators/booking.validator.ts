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

export type BookingInput = {
  serviceId: string;
};

export function validateBooking(body: unknown): body is BookingInput {
  if (!body || typeof body !== "object") {
    return false;
  }

  const booking = body as Record<string, unknown>;
  return (
    typeof booking.serviceId === "string" &&
    booking.serviceId.trim() !== ""
  );
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