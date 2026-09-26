import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { validateTransaction } from "../validators/transaction.validator.js";
import { createTransaction } from "../services/transaction.service.js";

const transactionRoutes = new Hono();

transactionRoutes.post("/", async (c) => {
  const body = await c.req.json();

  const error = validateTransaction(body);

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
    const transaction = await createTransaction(
      body.bookingId,
      body.amount
    );

    return c.json(
      {
        success: true,
        data: transaction,
      },
      201
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Transaction failed",
      },
      400
    );
  }
});

transactionRoutes.get("/", async (c) => {
  const transactions = await prisma.transaction.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return c.json({
    success: true,
    data: transactions,
  });
});

export default transactionRoutes;