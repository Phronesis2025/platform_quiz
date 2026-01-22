# Database Setup Guide

This project uses Vercel Postgres with Drizzle ORM for data persistence.

## Prerequisites

1. A Vercel account with a Postgres database
2. Node.js and npm installed

## Local Development Setup

### 1. Get Your Database Connection String

1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to **Settings** > **Storage** > **Postgres**
4. Copy the connection string (it will look like `postgres://...`)

### 2. Create Environment File

Create a `.env.local` file in the root of your project:

```env
POSTGRES_URL=postgresql://user:password@host:port/database
```

**Note:** For local development, you can either:
- Use your Vercel Postgres connection string directly
- Set up a local Postgres instance and use that connection string

### 3. Run Migrations

To create the database tables, run:

```bash
npm run db:push
```

This will push the schema to your database and create the `submissions` table.

Alternatively, if you want to generate migration files:

```bash
npm run db:generate  # Generate migration files
npm run db:migrate   # Apply migrations (if using migration files)
```

### 4. Verify Setup

Start your development server:

```bash
npm run dev
```

Submit a quiz and check your Vercel Postgres dashboard to verify the data is being saved.

## Vercel Deployment

### 1. Add Environment Variable

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add `POSTGRES_URL` with your Postgres connection string
4. Make sure it's available for **Production**, **Preview**, and **Development** environments

### 2. Deploy

When you deploy to Vercel, the database connection will automatically use the environment variable.

### 3. Run Migrations on Vercel

You can run migrations in a few ways:

**Option A: Using Vercel CLI (Recommended)**
```bash
vercel env pull .env.local  # Pull environment variables
npm run db:push              # Push schema to database
```

**Option B: Using Drizzle Studio**
```bash
npm run db:studio
```

**Option C: Manual SQL**
Copy the SQL from `drizzle/0000_uneven_the_phantom.sql` and run it in your Vercel Postgres dashboard.

## Database Schema

The `submissions` table contains:

- `id` (UUID) - Primary key
- `created_at` (timestamp) - When the submission was created
- `name` (varchar, nullable) - User's name
- `team` (varchar, nullable) - User's team
- `answers` (jsonb) - Quiz responses
- `totals` (jsonb) - Role score totals
- `ranked_roles` (jsonb) - Ranked role results
- `primary_role` (varchar) - Primary role fit
- `secondary_role` (varchar, nullable) - Secondary role if applicable
- `summary_text` (text) - Narrative summary
- `user_agent` (varchar, nullable) - Browser user agent
- `ip_hash` (varchar, nullable) - SHA-256 hash of IP address

## Useful Commands

- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:push` - Push schema changes directly to database (no migration files)
- `npm run db:migrate` - Apply migration files to database
- `npm run db:studio` - Open Drizzle Studio to browse your database

## Troubleshooting

### Connection Issues

- Verify your `POSTGRES_URL` is correct
- Check that your Vercel Postgres database is active
- Ensure the connection string includes all required parameters

### Migration Issues

- Make sure you're using the correct connection string
- For Vercel Postgres, use the connection string from the dashboard
- If using connection pooling, you might need `POSTGRES_URL_NON_POOLING` for migrations

### Type Errors

- Run `npm run build` to check for TypeScript errors
- Ensure all imports are correct in your schema and database files
