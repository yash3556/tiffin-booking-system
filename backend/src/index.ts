import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({
    success: true,
    message: "Tiffin Hub backend is running",
  });
});

serve({
  fetch: app.fetch,
  port: 3000,
});

console.log("Server running on http://localhost:3000");