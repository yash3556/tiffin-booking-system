export type Customer = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
};

export type CreateCustomerPayload = {
  name: string;
  phone: string;
};
