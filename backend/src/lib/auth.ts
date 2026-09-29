import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "./prisma.js";

const secret = process.env.BETTER_AUTH_SECRET;

if (!secret) {
  throw new Error("BETTER_AUTH_SECRET must be configured");
}

const webOrigins = (process.env.CLIENT_ORIGINS ?? "http://localhost:8081")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const appScheme = process.env.EXPO_APP_SCHEME ?? "frontend";

export const auth = betterAuth({
  appName: "Tiffin Hub",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    ...webOrigins,
    `${appScheme}://`,
    ...(process.env.NODE_ENV === "production" ? [] : ["exp://**"]),
  ],
  plugins: [expo()],
});

export type AuthSession = typeof auth.$Infer.Session;
