import { apiFetch } from './api';
import type { CreateCustomerPayload, Customer } from '@/types/customer';

export function createCustomer(payload: CreateCustomerPayload): Promise<Customer> {
  return apiFetch<Customer>('/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
