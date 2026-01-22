CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(255),
	"team" varchar(255),
	"answers" jsonb NOT NULL,
	"totals" jsonb NOT NULL,
	"ranked_roles" jsonb NOT NULL,
	"primary_role" varchar(50) NOT NULL,
	"secondary_role" varchar(50),
	"summary_text" text NOT NULL,
	"user_agent" varchar(500),
	"ip_hash" varchar(64)
);
