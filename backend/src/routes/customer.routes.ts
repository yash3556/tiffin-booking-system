 
import { Hono } from "hono";
import { authMiddleware, type AuthEnv } from "../middleware/auth.middleware.js";
import {
  createCustomer,
  getCustomerForUser,
} from "../services/customer.service.js";
import {
  customerValidationMessage,
  validateCustomer,
} from "../validators/customer.validator.js";

const customerRoutes = new Hono<AuthEnv>();

customerRoutes.use("*", authMiddleware);

customerRoutes.get("/me", async (c) => {
  try {
    const customer = await getCustomerForUser(
      c.get("authSession").user.id
    );

    if (!customer) {
      return c.json(
        { success: false, message: "Customer onboarding is required" },
        404
      );
    }

    return c.json({ success: true, data: customer });
  } catch (error) {
    console.error("Could not get customer profile", error);
    return c.json(
      { success: false, message: "Could not get customer profile" },
      500
    );
  }
});

customerRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!validateCustomer(body)) {
    return c.json(
      {
        success: false,
        message: customerValidationMessage(body),
      },
      400
    );
  }

  try {
    const existingCustomer = await getCustomerForUser(
      c.get("authSession").user.id
    );
    if (existingCustomer) {
      return c.json(
        { success: false, message: "Customer profile already exists" },
        409
      );
    }

    const customer = await createCustomer(
      body.name.trim(),
      body.phone.trim(),
      c.get("authSession").user.id
    );

    return c.json(
      {
        success: true,
        data: customer,
      },
      201
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return c.json(
        {
          success: false,
          message: "Customer profile already exists or phone is unavailable",
        },
        409
      );
    }

    console.error("Could not create customer profile", error);
    return c.json(
      {
        success: false,
        message: "Could not create customer profile",
      },
      500
    );
  }
});

export default customerRoutes;
