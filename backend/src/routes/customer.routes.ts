 
import { Hono } from "hono";
import { validateCustomer } from "../validators/customer.validator.js";
import { createCustomer } from "../services/customer.service.js";

const customerRoutes = new Hono();

customerRoutes.post("/", async (c) => {
  const body = await c.req.json();

  const error = validateCustomer(body);

  if (error) {
    return c.json(
      {
        success: false,
        message: error,
      },
      400
    );
  }

  try {
    const customer = await createCustomer(body.name, body.phone);

    return c.json(
      {
        success: true,
        data: customer,
      },
      201
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Could not create customer",
      },
      500
    );
  }
});

export default customerRoutes;

