import { apiFetch } from './api';

import type {
  Booking,
  BookingHistory,
  BookingStatus,
  CreateBookingPayload,
} from '@/types/booking';

export function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  return apiFetch<Booking>('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getBooking(id: string): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${id}`);
}

export function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function getBookingHistory(id: string): Promise<BookingHistory[]> {
  return apiFetch<BookingHistory[]>(`/bookings/${id}/history`);
}