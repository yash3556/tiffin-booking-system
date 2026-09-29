export type TransactionInput = {
  bookingId: string;
  amount: number;
};

export function validateTransaction(body: unknown): body is TransactionInput {
  if (!body || typeof body !== "object") {
    return false;
  }

  const transaction = body as Record<string, unknown>;
  if (
    typeof transaction.bookingId !== "string" ||
    transaction.bookingId.trim() === ""
  ) {
    return false;
  }

  if (
    typeof transaction.amount !== "number" ||
    !Number.isInteger(transaction.amount) ||
    transaction.amount <= 0
  ) {
    return false;
  }

  return true;
}

export function transactionValidationMessage(body: unknown) {
  if (!body || typeof body !== "object") {
    return "Request body is required";
  }
  const transaction = body as Record<string, unknown>;
  if (
    typeof transaction.bookingId !== "string" ||
    transaction.bookingId.trim() === ""
  ) {
    return "Valid bookingId is required";
  }
  return "Amount must be a positive integer";
}