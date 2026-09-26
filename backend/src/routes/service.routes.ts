import { Hono } from "hono";
import { validateService } from "../validators/service.validator.js";
import {
  createService,
  getServices,
} from "../services/service.service.js";

const serviceRoutes = new Hono();


serviceRoutes.get("/", async (c) => {
  try {
    const services = await getServices();

    return c.json({
      success: true,
      data: services,
    });
  } catch {
    return c.json(
      {
        success: false,
        message: "Could not fetch services",
      },
      500
    );
  }
});

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