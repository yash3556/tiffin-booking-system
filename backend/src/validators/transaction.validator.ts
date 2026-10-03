export type TransactionInput = {
  bookingId: string;
};
export type CheckoutVerificationInput = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export function validateTransaction(body: unknown): body is TransactionInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return false;
  }

  const transaction = body as Record<string, unknown>;
  return (
    Object.keys(transaction).length === 1 &&
    typeof transaction.bookingId === "string" &&
    transaction.bookingId.trim() !== ""
  );
}

export function transactionValidationMessage(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must contain bookingId";
  }
  return "Only a valid bookingId is accepted";
}

export function validateIdempotencyKey(key: string | undefined) {
  return typeof key === "string" && key.trim().length > 0 && key.length <= 128;
}

export function validateCheckoutVerification(
  body: unknown
): body is CheckoutVerificationInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return false;
  }
  const result = body as Record<string, unknown>;
  return (
    Object.keys(result).length === 3 &&
    typeof result.razorpay_order_id === "string" &&
    result.razorpay_order_id.length > 0 &&
    typeof result.razorpay_payment_id === "string" &&
    result.razorpay_payment_id.length > 0 &&
    typeof result.razorpay_signature === "string" &&
    result.razorpay_signature.length > 0
  );
}
