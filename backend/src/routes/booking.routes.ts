import { Hono, type Context } from "hono";

import {
  isBookingStatus,
  validateBooking,
  validateBookingStatus,
} from "../validators/booking.validator.js";
import {
  BookingError,
  createBooking,
  getBooking,
  getBookingHistory,
  updateBookingStatus,
} from "../services/booking.service.js";

const bookingRoutes = new Hono();

function handleBookingError(
  c: Context,
  error: unknown,
  fallback: string
) {
  if (error instanceof BookingError) {
    return c.json(
      { success: false, message: error.message },
      error.statusCode
    );
  }

  console.error(fallback, error);
  return c.json({ success: false, message: fallback }, 500);
}

bookingRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);

  const validationError = validateBooking(body);
  if (validationError) {
    return c.json(
      {
        success: false,
        message: validationError,
      },
      400
    );
  }

  try {
    const booking = await createBooking(
      body.customerId,
      body.serviceId
    );

    return c.json(
      {
        success: true,
        data: booking,
      },
      201
    );
  } catch (error) {
    return handleBookingError(c, error, "Could not create booking");
  }
});

bookingRoutes.get("/:id", async (c) => {
  try {
    const booking = await getBooking(c.req.param("id"));

    if (!booking) {
      return c.json(
        { success: false, message: "Booking not found" },
        404
      );
    }

    return c.json({ success: true, data: booking });
  } catch (error) {
    return handleBookingError(c, error, "Could not get booking");
  }
});

bookingRoutes.patch("/:id/status", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const validationError = validateBookingStatus(body);

  if (validationError) {
    return c.json(
      { success: false, message: validationError },
      400
    );
  }

  if (!isBookingStatus(body.status)) {
    return c.json(
      { success: false, message: "Invalid booking status" },
      400
    );
  }

  try {
    const booking = await updateBookingStatus(id, body.status);
    return c.json({ success: true, data: booking });
  } catch (error) {
    return handleBookingError(c, error, "Could not update booking status");
  }
});

bookingRoutes.get("/:id/history", async (c) => {
  try {
    const history = await getBookingHistory(c.req.param("id"));
    return c.json({ success: true, data: history });
  } catch (error) {
    return handleBookingError(c, error, "Could not get booking history");
  }
});

export default bookingRoutes;