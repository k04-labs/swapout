// prisma.config.ts
import "dotenv/config"; // Must be at the top
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"), // Or use: process.env.DATABASE_URL
  },
});
