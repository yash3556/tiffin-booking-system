import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import customerRoutes from "./routes/customer.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import { createAuthRoutes } from "./routes/auth.routes.js";
import { auth } from "./lib/auth.js";

const app = new Hono();



const allowedOrigins = (
  process.env.CLIENT_ORIGINS ?? "http://localhost:8081"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  "*",
  cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : ""),
    credentials: true,
  })
);

app.use("/api/auth/*", async (c, next) => {
  console.log("AUTH ORIGIN:", c.req.header("Origin"));
  console.log("AUTH USER-AGENT:", c.req.header("User-Agent"));
  await next();
});

app.route("/api/auth", createAuthRoutes(auth.handler));

app.get("/", (c) => {
  return c.json({
    success: true,
    message: "Server is running on port 3000",
  });
});

app.get("/health", (c) => {
  return c.json({
    success: true,
    message: "Tiffin Hub backend is running",
  });
});

app.route("/customers", customerRoutes);
app.route("/services", serviceRoutes);
app.route("/bookings", bookingRoutes);
app.route("/transactions", transactionRoutes);

serve({
  fetch: app.fetch,
  port: 3000,
});

console.log("Server running on http://localhost:3000");

export { app };