import { apiFetch } from './api';
import type { CreateTransactionPayload, Transaction } from '@/types/transaction';

export function createTransaction(
  { bookingId, idempotencyKey }: CreateTransactionPayload,
): Promise<Transaction> {
  return apiFetch<Transaction>('/transactions', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ bookingId }),
  });
}

export function getTransactions(): Promise<Transaction[]> {
  return apiFetch<Transaction[]>('/transactions');
}
