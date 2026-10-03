import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreatePaymentOrderInput,
  PaymentContext,
  PaymentProvider,
  ProviderPayment,
} from "./payment-provider.js";

export const mockPaymentProvider: PaymentProvider = {
  getKeyId() {
    getMockPaymentSecret();
    return "mock";
  },

  async createOrder(input: CreatePaymentOrderInput) {
    // Deriving both IDs from the transaction keeps retries stable without a gateway.
    const orderId = `mock_order_${input.receipt}`;

    return {
      id: orderId,
      amount: input.amount,
      currency: input.currency,
      mockPayment: createMockPaymentDetails({
        orderId,
        amount: input.amount,
        currency: input.currency,
      }),
    };
  },

  getMockPaymentDetails: createMockPaymentDetails,

  verifyCheckoutSignature(orderId, paymentId, signature) {
    const secret = getMockPaymentSecret();
    if (!/^[a-f\d]{64}$/i.test(signature)) {
      return false;
    }
    const expected = createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest();
    const received = Buffer.from(signature, "hex");
    return received.length === expected.length && timingSafeEqual(received, expected);
  },

  async fetchPayment(
    paymentId: string,
    context: PaymentContext
  ): Promise<ProviderPayment> {
    if (paymentId !== getMockPaymentId(context.orderId)) {
      throw new Error("Mock payment does not match the order");
    }
    return {
      id: paymentId,
      order_id: context.orderId,
      amount: context.amount,
      currency: context.currency,
      status: "captured",
      captured: true,
    };
  },
};

function getMockPaymentId(orderId: string) {
  return `mock_payment_${orderId.slice("mock_order_".length)}`;
}

function createMockPaymentSignature(orderId: string, paymentId: string) {
  return createHmac("sha256", getMockPaymentSecret())
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

function createMockPaymentDetails(context: PaymentContext) {
  const paymentId = getMockPaymentId(context.orderId);
  return {
    orderId: context.orderId,
    paymentId,
    amount: context.amount,
    currency: context.currency,
    status: "captured" as const,
    signature: createMockPaymentSignature(context.orderId, paymentId),
  };
}

function getMockPaymentSecret() {
  const secret = process.env.MOCK_PAYMENT_SECRET;
  if (!secret) {
    throw new Error("MOCK_PAYMENT_SECRET must be configured");
  }
  return secret;
}
