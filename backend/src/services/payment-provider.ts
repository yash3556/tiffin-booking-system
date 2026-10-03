import { mockPaymentProvider } from "./mock-payment-provider.js";
import { razorpayPaymentProvider } from "./razorpay-payment-provider.js";

export type CreatePaymentOrderInput = {
  amount: number;
  currency: string;
  receipt: string;
  notes: {
    transactionId: string;
    bookingId: string;
  };
};

export type PaymentContext = {
  orderId: string;
  amount: number;
  currency: string;
};

export type ProviderPayment = {
  id: string;
  order_id: string;
  amount: number | string;
  currency: string;
  status: string;
  captured?: boolean;
};

export type MockPaymentDetails = {
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: "captured";
  signature: string;
};

export type CreatedPaymentOrder = {
  id: string;
  amount: number | string;
  currency: string;
  mockPayment?: MockPaymentDetails;
};

export interface PaymentProvider {
  getKeyId(): string;
  createOrder(input: CreatePaymentOrderInput): Promise<CreatedPaymentOrder>;
  getMockPaymentDetails?(context: PaymentContext): MockPaymentDetails;
  verifyCheckoutSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean;
  fetchPayment(
    paymentId: string,
    context: PaymentContext
  ): Promise<ProviderPayment>;
}

export function getPaymentProvider(): PaymentProvider {
  // Keep Razorpay as the default so existing deployments retain their behavior.
  const provider = process.env.PAYMENT_PROVIDER ?? "razorpay";
  if (provider === "mock") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("The mock payment provider is not available in production");
    }
    return mockPaymentProvider;
  }
  if (provider === "razorpay") {
    return razorpayPaymentProvider;
  }
  throw new Error(`Unsupported PAYMENT_PROVIDER: ${provider}`);
}
