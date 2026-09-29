import { Hono } from "hono";

export function createAuthRoutes(
  handler: (request: Request) => Promise<Response>
) {
  const routes = new Hono();
  routes.all("*", (c) => handler(c.req.raw));
  return routes;
}
