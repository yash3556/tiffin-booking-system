import { Hono, type Context, type MiddlewareHandler } from "hono";
import {
  authMiddleware,
  type AuthEnv,
} from "../middleware/auth.middleware.js";
import { getCustomerForUser } from "../services/customer.service.js";
import {
  createTransaction,
  getTransaction,
  getTransactionsForBooking,
  getTransactionsForCustomer,
  TransactionError,
} from "../services/transaction.service.js";
import {
  transactionValidationMessage,
  validateTransaction,
} from "../validators/transaction.validator.js";

const transactionServices = {
  getCustomerForUser,
  createTransaction,
  getTransaction,
  getTransactionsForBooking,
  getTransactionsForCustomer,
};

type TransactionRouteDependencies = Partial<typeof transactionServices>;

function handleTransactionError(
  c: Context,
  error: unknown,
  fallback: string
) {
  if (error instanceof TransactionError) {
    return c.json(
      { success: false, message: error.message },
      error.statusCode
    );
  }

  console.error(fallback, error);
  return c.json({ success: false, message: fallback }, 500);
}

export function createTransactionRoutes(
  overrides: TransactionRouteDependencies = {},
  middleware: MiddlewareHandler<AuthEnv> = authMiddleware
) {
  const services = { ...transactionServices, ...overrides };
  const routes = new Hono<AuthEnv>();
  routes.use("*", middleware);

  routes.post("/", async (c) => {
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
      const customer = await services.getCustomerForUser(
        c.get("authSession").user.id
      );
      if (!customer) {
        return c.json(
          { success: false, message: "Customer onboarding is required" },
          409
        );
      }

      const transaction = await services.createTransaction(
        body.bookingId,
        body.amount,
        customer.id
      );
      return c.json({ success: true, data: transaction }, 201);
    } catch (error) {
      return handleTransactionError(
        c,
        error,
        "Could not create transaction"
      );
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

      const transactions = await services.getTransactionsForCustomer(
        customer.id
      );
      return c.json({ success: true, data: transactions });
    } catch (error) {
      return handleTransactionError(
        c,
        error,
        "Could not get transactions"
      );
    }
  });

  routes.get("/booking/:bookingId", async (c) => {
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

      const transactions = await services.getTransactionsForBooking(
        c.req.param("bookingId"),
        customer.id
      );
      return c.json({ success: true, data: transactions });
    } catch (error) {
      return handleTransactionError(
        c,
        error,
        "Could not get booking transactions"
      );
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

      const transaction = await services.getTransaction(
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
      return handleTransactionError(
        c,
        error,
        "Could not get transaction"
      );
    }
  });

  return routes;
}

export default createTransactionRoutes();
