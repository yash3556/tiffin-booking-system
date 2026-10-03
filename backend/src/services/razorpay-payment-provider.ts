import {
  getRazorpayClient,
  getRazorpayKeyId,
  verifyCheckoutSignature,
} from "../lib/razorpay.js";
import type {
  CreatePaymentOrderInput,
  PaymentProvider,
} from "./payment-provider.js";

export const razorpayPaymentProvider: PaymentProvider = {
  getKeyId() {
    return getRazorpayKeyId();
  },

  async createOrder(input: CreatePaymentOrderInput) {
    const order = await getRazorpayClient().orders.create(input);
    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  },

  verifyCheckoutSignature,

  async fetchPayment(paymentId, _context) {
    return getRazorpayClient().payments.fetch(paymentId);
  },
};
