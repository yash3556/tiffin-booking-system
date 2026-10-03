import { Hono, type Context, type MiddlewareHandler } from "hono";
import {
  authMiddleware,
  type AuthEnv,
} from "../middleware/auth.middleware.js";
import {
  createBooking,
  getBooking,
  getBookingsForCustomer,
  getBookingHistory,
  BookingError,
  updateBookingStatus,
} from "../services/booking.service.js";
import { getCustomerForUser } from "../services/customer.service.js";
import {
  isBookingStatus,
  validateBooking,
  validateBookingStatus,
} from "../validators/booking.validator.js";

const bookingServices = {
  getCustomerForUser,
  createBooking,
  getBooking,
  getBookingsForCustomer,
  getBookingHistory,
  updateBookingStatus,
};

type BookingRouteDependencies = Partial<typeof bookingServices>;

function handleBookingError(c: Context, error: unknown, fallback: string) {
  if (error instanceof BookingError) {
    return c.json(
      { success: false, message: error.message },
      error.statusCode
    );
  }

  console.error(fallback, error);
  return c.json({ success: false, message: fallback }, 500);
}

export function createBookingRoutes(
  overrides: BookingRouteDependencies = {},
  middleware: MiddlewareHandler<AuthEnv> = authMiddleware
) {
  const services = { ...bookingServices, ...overrides };
  const routes = new Hono<AuthEnv>();
  routes.use("*", middleware);

  routes.post("/", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!validateBooking(body)) {
      return c.json(
        { success: false, message: "Valid serviceId is required" },
        400
      );
    }

    try {
      const customer = await services.getCustomerForUser(
        c.get("authSession").user.id
      );
      if (!customer) {
        return c.json(
          { success: false, message: "Customer onboarding is required" },
          409
        );
      }

      const booking = await services.createBooking(
        customer.id,
        body.serviceId.trim()
      );
      return c.json({ success: true, data: booking }, 201);
    } catch (error) {
      return handleBookingError(c, error, "Could not create booking");
    }
  });

  routes.get("/", async (c) => {
    try {
      const customer = await services.getCustomerForUser(
        c.get("authSession").user.id
      );
      if (!customer) {
        return c.json(
          { success: false, message: "Customer onboarding is required" },
          409
        );
      }

      const bookings = await services.getBookingsForCustomer(customer.id);
      return c.json({ success: true, data: bookings });
    } catch (error) {
      return handleBookingError(c, error, "Could not get bookings");
    }
  });

  routes.get("/:id", async (c) => {
    try {
      const customer = await services.getCustomerForUser(
        c.get("authSession").user.id
      );
      if (!customer) {
        return c.json(
          { success: false, message: "Customer onboarding is required" },
          409
        );
      }

      const booking = await services.getBooking(
        c.req.param("id"),
        customer.id
      );
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

  routes.patch("/:id/status", async (c) => {
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
      const customer = await services.getCustomerForUser(
        c.get("authSession").user.id
      );
      if (!customer) {
        return c.json(
          { success: false, message: "Customer onboarding is required" },
          409
        );
      }

      const booking = await services.updateBookingStatus(
        id,
        customer.id,
        body.status
      );
      return c.json({ success: true, data: booking });
    } catch (error) {
      return handleBookingError(c, error, "Could not update booking status");
    }
  });

  routes.get("/:id/history", async (c) => {
    try {
      const customer = await services.getCustomerForUser(
        c.get("authSession").user.id
      );
      if (!customer) {
        return c.json(
          { success: false, message: "Customer onboarding is required" },
          409
        );
      }

      const history = await services.getBookingHistory(
        c.req.param("id"),
        customer.id
      );
      return c.json({ success: true, data: history });
    } catch (error) {
      return handleBookingError(c, error, "Could not get booking history");
    }
  });

  return routes;
}

export default createBookingRoutes();
