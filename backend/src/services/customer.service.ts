import { prisma } from "../lib/prisma.js";

export async function createCustomer(name: string, phone: string) {
  return prisma.customer.create({
    data: {
      name,
      phone,
    },
  });
}