import { Hono } from "hono";
import { authMiddleware, type AuthEnv } from "../middleware/auth.middleware.js";
import { getCustomerForUser } from "../services/customer.service.js";
import {
  transactionValidationMessage,
  validateTransaction,
} from "../validators/transaction.validator.js";
import {
  createTransaction,
  getTransaction,
  getTransactionsForBooking,
  getTransactionsForCustomer,
  TransactionError,
} from "../services/transaction.service.js";

const transactionRoutes = new Hono<AuthEnv>();
transactionRoutes.use("*", authMiddleware);

transactionRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!validateTransaction(body)) {
    return c.json(
      {
        success: false,
        message: transactionValidationMessage(body),
      },
      400
    );
  }

  try {
    const customer = await getCustomerForUser(
      c.get("authSession").user.id
    );
    if (!customer) {
      return c.json(
        { success: false, message: "Customer onboarding is required" },
        409
      );
    }

    const transaction = await createTransaction(
      body.bookingId,
      body.amount,
      customer.id
    );

    return c.json(
      {
        success: true,
        data: transaction,
      },
      201
    );
  } catch (error) {
    if (error instanceof TransactionError) {
      return c.json(
        { success: false, message: error.message },
        error.statusCode
      );
    }

    console.error("Could not create transaction", error);
    return c.json(
      {
        success: false,
        message: "Could not create transaction",
      },
      500
    );
  }
});

transactionRoutes.get("/", async (c) => {
  try {
    const customer = await getCustomerForUser(
      c.get("authSession").user.id
    );
    if (!customer) {
      return c.json(
        { success: false, message: "Customer onboarding is required" },
        409
      );
    }

    const transactions = await getTransactionsForCustomer(customer.id);

    return c.json({ success: true, data: transactions });
  } catch (error) {
    console.error("Could not get transactions", error);
    return c.json(
      { success: false, message: "Could not get transactions" },
      500
    );
  }
});

transactionRoutes.get("/booking/:bookingId", async (c) => {
  try {
    const customer = await getCustomerForUser(
      c.get("authSession").user.id
    );
    if (!customer) {
      return c.json(
        { success: false, message: "Customer onboarding is required" },
        409
      );
    }

    const transactions = await getTransactionsForBooking(
      c.req.param("bookingId"),
      customer.id
    );

    return c.json({ success: true, data: transactions });
  } catch (error) {
    if (error instanceof TransactionError) {
      return c.json(
        { success: false, message: error.message },
        error.statusCode
      );
    }

    console.error("Could not get booking transactions", error);
    return c.json(
      { success: false, message: "Could not get booking transactions" },
      500
    );
  }
});

transactionRoutes.get("/:id", async (c) => {
  try {
    const customer = await getCustomerForUser(
      c.get("authSession").user.id
    );
    if (!customer) {
      return c.json(
        { success: false, message: "Customer onboarding is required" },
        409
      );
    }

    const transaction = await getTransaction(
      c.req.param("id"),
      customer.id
    );
    if (!transaction) {
      return c.json(
        { success: false, message: "Transaction not found" },
        404
      );
    }

    return c.json({ success: true, data: transaction });
  } catch (error) {
    console.error("Could not get transaction", error);
    return c.json(
      { success: false, message: "Could not get transaction" },
      500
    );
  }
});

export default transactionRoutes;