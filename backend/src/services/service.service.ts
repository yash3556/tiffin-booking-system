import { prisma } from "../lib/prisma.js";

export const createService = async (
  name: string,
  price: number
) => {
  return prisma.service.create({
    data: {
      name,
      price,
    },
  });
};

export const getServices = async () => {
  return prisma.service.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};