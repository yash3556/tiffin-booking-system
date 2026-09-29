import { prisma } from "../lib/prisma.js";

export async function createCustomer(
  name: string,
  phone: string,
  userId: string
) {
  return prisma.customer.create({
    data: {
      name,
      phone,
      userId,
    },
  });
}

export async function getCustomerForUser(userId: string) {
  return prisma.customer.findUnique({
    where: { userId },
  });
}