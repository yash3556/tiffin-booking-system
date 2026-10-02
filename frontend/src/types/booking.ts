import type { Customer } from './customer';
import type { Service } from './service';
import type { Transaction } from './transaction';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type Booking = {
  id: string;
  customerId: string;
  serviceId: string;
  status: BookingStatus;
  createdAt: string;
  customer?: Customer;
  service?: Service;
  transactions?: Transaction[];
};

export type CreateBookingPayload = {
  serviceId: string;
};

export type UpdateBookingStatusPayload = {
  status: BookingStatus;
};

export type BookingHistory = {
  id: string;
  bookingId: string;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  createdAt: string;
};