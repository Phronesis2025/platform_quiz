import { pgTable, uuid, timestamp, varchar, jsonb, text } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

/**
 * Database schema for quiz submissions
 * 
 * This table stores all quiz submissions with their responses and scoring results.
 */
export const submissions = pgTable("submissions", {
  // Primary key: UUID
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Timestamp when the submission was created
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  
  // Optional user information
  name: varchar("name", { length: 255 }),
  team: varchar("team", { length: 255 }),
  
  // Quiz responses: JSON object mapping question IDs to responses
  answers: jsonb("answers").notNull(),
  
  // Scoring totals: JSON object with role scores
  totals: jsonb("totals").notNull(),
  
  // Ranked roles: JSON array of ranked role results
  rankedRoles: jsonb("ranked_roles").notNull(),
  
  // Primary role (can be single role ID or "Role1 + Role2" format)
  primaryRole: varchar("primary_role", { length: 50 }).notNull(),
  
  // Secondary role (optional)
  secondaryRole: varchar("secondary_role", { length: 50 }),
  
  // Narrative summary text
  summaryText: text("summary_text").notNull(),
  
  // Optional metadata
  userAgent: varchar("user_agent", { length: 500 }),
  ipHash: varchar("ip_hash", { length: 64 }), // SHA-256 hash of IP address
});

// TypeScript types for type-safe database operations
export type Submission = InferSelectModel<typeof submissions>;
export type NewSubmission = InferInsertModel<typeof submissions>;
