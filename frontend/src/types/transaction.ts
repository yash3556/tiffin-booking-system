export type TransactionStatus =
  | 'CREATING_ORDER'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'SUCCESS'
  | 'FAILED'
  | 'RECONCILIATION_REQUIRED';

export type Transaction = {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  idempotencyKey: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  keyId?: string;
};

export type CreateTransactionPayload = {
  bookingId: string;
  idempotencyKey: string;
};
