import { prisma } from "../lib/prisma.js";

export async function createService(name: string, price: number) {
  return prisma.service.create({
    data: {
      name,
      price,
    },
  });
}