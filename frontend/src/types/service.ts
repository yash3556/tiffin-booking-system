export type Service = {
  id: string;
  name: string;
  price: number;
  createdAt: string;
};

export type CreateServicePayload = {
  name: string;
  price: number;
};
