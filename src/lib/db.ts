import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

/**
 * Database connection using Vercel Postgres
 * 
 * This uses the @vercel/postgres package which automatically reads from
 * environment variables:
 * - POSTGRES_URL (required)
 * - POSTGRES_PRISMA_URL (optional, for Prisma compatibility)
 * - POSTGRES_URL_NON_POOLING (optional, for migrations)
 * 
 * For local development, set these in .env.local
 * For Vercel deployment, set them in the Vercel dashboard
 */
export const db = drizzle(sql, { schema });

/**
 * Type helper for database queries
 */
export type Database = typeof db;
