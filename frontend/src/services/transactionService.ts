import { apiFetch } from './api';
import type { CreateTransactionPayload, Transaction } from '@/types/transaction';

export function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  return apiFetch<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getTransactions(): Promise<Transaction[]> {
  return apiFetch<Transaction[]>('/transactions');
}
