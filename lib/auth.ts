import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const isProd = process.env.NODE_ENV === "production";

const baseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";
const authSecret =
  process.env.BETTER_AUTH_SECRET ??
  "Qf9s0D2k7Pz1xL8mVb4nR6tY3wA5uC1eH9jN2gK7pS4dF8hM";

const hasGoogleOAuth = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL,
  secret: authSecret,
  trustedOrigins: [baseURL],
  plugins: [nextCookies()],
  socialProviders: hasGoogleOAuth
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : undefined,
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: isProd,
  },
});
