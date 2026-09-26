import { apiFetch } from './api';
import type { CreateServicePayload, Service } from '@/types/service';

export function getServices(): Promise<Service[]> {
  return apiFetch<Service[]>('/services');
}

export function createService(payload: CreateServicePayload): Promise<Service> {
  return apiFetch<Service>('/services', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
