import type { Config } from "drizzle-kit";

/**
 * Drizzle configuration for migrations
 * 
 * This configures Drizzle to work with Vercel Postgres.
 * It reads the POSTGRES_URL from environment variables.
 */
export default {
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
} satisfies Config;
