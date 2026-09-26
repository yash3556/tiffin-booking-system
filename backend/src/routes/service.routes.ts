import { Hono } from "hono";
import { validateService } from "../validators/service.validator.js";
import { createService } from "../services/service.service.js";

const serviceRoutes = new Hono();

serviceRoutes.post("/", async (c) => {
  const body = await c.req.json();

  const error = validateService(body);

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
    const service = await createService(
      body.name,
      body.price
    );

    return c.json(
      {
        success: true,
        data: service,
      },
      201
    );
  } catch {
    return c.json(
      {
        success: false,
        message: "Could not create service",
      },
      500
    );
  }
});

export default serviceRoutes;