export function validateTransaction(body: any) {
  if (!body) {
    return "Request body is required";
  }

  if (
    typeof body.bookingId !== "string" ||
    body.bookingId.trim() === ""
  ) {
    return "Valid bookingId is required";
  }

  if (
    typeof body.amount !== "number" ||
    !Number.isInteger(body.amount) ||
    body.amount <= 0
  ) {
    return "Amount must be a positive integer";
  }

  return null;
}