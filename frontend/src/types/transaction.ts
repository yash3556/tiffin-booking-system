export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export type Transaction = {
  id: string;
  bookingId: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
};

export type CreateTransactionPayload = {
  bookingId: string;
  amount: number;
};
