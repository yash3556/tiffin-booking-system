export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 400 | 403 | 404 | 409 | 503
  ) {
    super(message);
    this.name = "PaymentError";
  }
}
