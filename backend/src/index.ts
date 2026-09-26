import { serve } from "@hono/node-server";
import { Hono } from "hono";
import customerRoutes from "./routes/customer.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";

const app = new Hono();


app.get('/',(c)=>{
  return c.json({
    success:true,
    message:"Server is runnning on port 3000",
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