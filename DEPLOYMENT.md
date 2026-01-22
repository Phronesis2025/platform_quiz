# Deployment Guide

This guide covers everything you need to deploy and manage the Platform Quiz application on Vercel.

**Repository**: [https://github.com/Phronesis2025/platform_quiz](https://github.com/Phronesis2025/platform_quiz)

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Vercel Postgres Setup](#vercel-postgres-setup)
3. [Environment Variables](#environment-variables)
4. [Running Migrations](#running-migrations)
5. [Access Code Management](#access-code-management)
6. [Data Retention & Privacy](#data-retention--privacy)
7. [Admin Features](#admin-features)
8. [Troubleshooting](#troubleshooting)

## Initial Setup

### Prerequisites

- Vercel account
- Node.js 18+ installed locally (for running migrations)
- Git repository connected to Vercel

### Deploy to Vercel

1. **Connect your repository** to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository

2. **Configure build settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

3. **Deploy**: Vercel will automatically deploy on every push to your main branch.

## Vercel Postgres Setup

### Step 1: Create Postgres Database

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database**
3. Select **Postgres**
4. Choose a database name (e.g., "platform-quiz-db")
5. Select a region closest to your users
6. Click **Create**

### Step 2: Get Connection String

1. After creating the database, go to **Settings** tab
2. Scroll to **Storage** section
3. Find your Postgres database
4. Click on it to view details
5. Copy the **Connection String** (it looks like `postgres://...`)

### Step 3: Add Environment Variable

1. In your Vercel project, go to **Settings** > **Environment Variables**
2. Click **Add New**
3. Add the following:
   - **Key**: `POSTGRES_URL`
   - **Value**: Paste your connection string
   - **Environments**: Select all (Production, Preview, Development)
4. Click **Save**

### Step 4: Run Migrations

See [Running Migrations](#running-migrations) section below.

## Environment Variables

### Required Variables

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `POSTGRES_URL` | Vercel Postgres connection string | Vercel Dashboard > Storage > Postgres > Settings |
| `NEXT_PUBLIC_QUIZ_CODE` | Access code for quiz (optional) | Set your own secret code |

### Optional Variables

| Variable | Description | When to Use |
|----------|-------------|-------------|
| `POSTGRES_URL_NON_POOLING` | Non-pooling connection string | For migrations if using connection pooling |
| `KV_REST_API_URL` | Vercel KV REST API URL | For production rate limiting |
| `KV_REST_API_TOKEN` | Vercel KV REST API token | For production rate limiting |

### Setting Environment Variables

#### Local Development

Create a `.env.local` file in the project root:

```env
POSTGRES_URL=postgresql://user:password@host:port/database
NEXT_PUBLIC_QUIZ_CODE=your-secret-code-here
```

**Note**: Never commit `.env.local` to Git. It's already in `.gitignore`.

#### Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add each variable:
   - Enter the key and value
   - Select which environments it applies to (Production, Preview, Development)
   - Click **Save**

**Important**: After adding environment variables, you need to **redeploy** your application for changes to take effect.

## Running Migrations

### Local Development

1. **Set up environment**:
   ```bash
   # Create .env.local with your Postgres connection string
   POSTGRES_URL=postgresql://user:password@host:port/database
   ```

2. **Push schema to database**:
   ```bash
   npm run db:push
   ```

   This will create the `submissions` table in your database.

### Production (Vercel)

#### Option 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link your project**:
   ```bash
   vercel link
   ```

4. **Pull environment variables**:
   ```bash
   vercel env pull .env.local
   ```

5. **Run migration**:
   ```bash
   npm run db:push
   ```

#### Option 2: Manual SQL

1. Go to your Vercel Postgres dashboard
2. Click on your database
3. Go to **Data** or **SQL Editor** tab
4. Copy the SQL from `drizzle/0000_uneven_the_phantom.sql`
5. Paste and execute the SQL

#### Option 3: Using Drizzle Studio

1. Pull environment variables (see Option 1, step 4)
2. Run Drizzle Studio:
   ```bash
   npm run db:studio
   ```
3. This opens a web interface where you can view and manage your database

### Verifying Migrations

After running migrations, verify the table was created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'submissions';
```

You should see the `submissions` table listed.

## Access Code Management

### Setting the Access Code

The access code prevents unauthorized access to the quiz. It's optional but recommended for production.

#### Local Development

Add to `.env.local`:
```env
NEXT_PUBLIC_QUIZ_CODE=your-secret-code-here
```

#### Production (Vercel)

1. Go to **Settings** > **Environment Variables**
2. Add:
   - **Key**: `NEXT_PUBLIC_QUIZ_CODE`
   - **Value**: Your secret code
   - **Environments**: Production, Preview (optional: Development)
3. Click **Save**
4. **Redeploy** your application

### Rotating the Access Code

If you need to change the access code (e.g., if it's been compromised):

1. **Generate a new code**:
   - Use a strong, random string
   - Example: `quiz-2024-abc123xyz`
   - You can use a password generator or: `openssl rand -hex 16`

2. **Update in Vercel**:
   - Go to **Settings** > **Environment Variables**
   - Find `NEXT_PUBLIC_QUIZ_CODE`
   - Click **Edit**
   - Update the value
   - Click **Save**

3. **Redeploy**:
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Select **Redeploy**
   - Or push a new commit to trigger a deployment

4. **Notify users**:
   - Share the new code with authorized users
   - Existing sessions will need to re-enter the code

**Note**: Users with the old code stored in their browser's sessionStorage will need to:
- Clear their browser sessionStorage, or
- Close and reopen their browser, or
- Enter the new code when prompted

### Disabling Access Code

To make the quiz publicly accessible:

1. Go to **Settings** > **Environment Variables**
2. Find `NEXT_PUBLIC_QUIZ_CODE`
3. Click **Delete** (or remove it from `.env.local` locally)
4. Redeploy your application

The quiz will work without requiring a code.

## Data Retention & Privacy

### Data Stored

The application stores the following data in the `submissions` table:

- **User Information**: Name (optional), Team (optional)
- **Quiz Responses**: All answers to quiz questions
- **Scoring Results**: Computed role fit scores and rankings
- **Metadata**: 
  - Creation timestamp
  - User agent (browser information)
  - IP hash (SHA-256 hash, not the actual IP address)

### Privacy Considerations

1. **IP Address Hashing**: 
   - IP addresses are hashed using SHA-256 before storage
   - This prevents identification of individual users while allowing rate limiting
   - Hashed IPs cannot be reversed to original IPs

2. **Optional Personal Information**:
   - Name and team are optional fields
   - Users can submit anonymously

3. **Data Access**:
   - Only accessible through the admin page
   - Consider adding authentication to the admin page for production use

### Data Retention Policy

**Recommended Guidelines**:

- **Retention Period**: Decide on a retention period (e.g., 90 days, 1 year)
- **Regular Cleanup**: Set up a scheduled job or manual process to delete old submissions
- **GDPR Compliance**: If applicable, ensure you can delete user data upon request

### Deleting Old Data

To delete submissions older than a certain date, you can run:

```sql
DELETE FROM submissions 
WHERE created_at < NOW() - INTERVAL '90 days';
```

Or use Drizzle Studio to manually delete records.

### Exporting Data Before Deletion

Before deleting data, export it using the CSV export feature in the admin page (see [Admin Features](#admin-features)).

## Admin Features

### Accessing the Admin Page

1. Navigate to `/admin` in your deployed application
2. Example: `https://your-app.vercel.app/admin`

**Note**: Currently, the admin page is not protected by authentication. Consider adding authentication for production use.

### Viewing Submissions

The admin page displays all quiz submissions in a table with:

- **Date**: When the submission was created
- **Name**: User's name (if provided)
- **Team**: User's team (if provided)
- **Primary Role**: Best fit role
- **Secondary Role**: Secondary fit (if applicable)
- **Score Spread**: Range between highest and lowest scores
- **View Details**: Link to full result page

### Filtering Submissions

1. **Filter by Team**:
   - Use the "Filter by Team" dropdown
   - Select a team to see only submissions from that team
   - Select "All Teams" to clear the filter

2. **Filter by Primary Role**:
   - Use the "Filter by Primary Role" dropdown
   - Select a role to see only submissions with that primary role
   - Select "All Roles" to clear the filter

3. **Clear Filters**:
   - Click "Clear filters" link when filters are active
   - Or select "All Teams" and "All Roles" from dropdowns

### Exporting to CSV

1. **Apply filters** (optional): Filter the data you want to export
2. **Click "Export to CSV"** button in the top right
3. **File downloads**: A CSV file named `role-fit-submissions-YYYY-MM-DD.csv` will download

**CSV Contents**:
- Date
- Name
- Team
- Primary Role
- Secondary Role
- Score Spread
- BE Score
- FE Score
- QA Score
- PM Score

**Note**: The CSV export includes only the currently filtered results. To export all data, clear all filters first.

### Summary Statistics

The admin page shows summary statistics:

- **Total Submissions**: Count of all submissions (filtered)
- **Unique Teams**: Number of different teams
- **Avg Score Spread**: Average score spread across submissions
- **Most Common Role**: Role that appears most frequently as primary

## Troubleshooting

### Database Connection Issues

**Error**: `missing_connection_string`

**Solution**:
1. Verify `POSTGRES_URL` is set in Vercel environment variables
2. Check that the connection string is correct
3. Ensure the database is active in Vercel dashboard
4. Redeploy after adding environment variables

### Migration Failures

**Error**: Migration fails to run

**Solutions**:
1. Verify `POSTGRES_URL` is correct
2. Check database permissions
3. Try using `POSTGRES_URL_NON_POOLING` for migrations
4. Run SQL manually using Vercel Postgres dashboard

### Access Code Not Working

**Symptoms**: Users can't access quiz even with correct code

**Solutions**:
1. Verify `NEXT_PUBLIC_QUIZ_CODE` is set in environment variables
2. Check that the code matches exactly (case-sensitive, no extra spaces)
3. Ensure the application has been redeployed after setting the variable
4. Clear browser sessionStorage: Open browser console and run `sessionStorage.clear()`

### Rate Limiting Issues

**Symptoms**: Legitimate users getting rate limited

**Solutions**:
1. Adjust rate limit settings in `src/lib/rate-limit.ts`:
   - `RATE_LIMIT_MAX_REQUESTS`: Increase from 5 if needed
   - `RATE_LIMIT_WINDOW_MS`: Adjust time window
2. For production, set up Vercel KV for better rate limiting:
   - Create Vercel KV storage
   - Set `KV_REST_API_URL` and `KV_REST_API_TOKEN`
   - Rate limiting will automatically use KV

### Build Errors

**Error**: TypeScript or build errors

**Solutions**:
1. Run `npm run build` locally to see errors
2. Check that all dependencies are installed: `npm install`
3. Verify TypeScript configuration is correct
4. Check for missing environment variables

### Admin Page Not Loading

**Symptoms**: Admin page shows "Loading..." indefinitely

**Solutions**:
1. Check browser console for errors
2. Verify `/api/submissions` endpoint is accessible
3. Check that database connection is working
4. Verify `POSTGRES_URL` is set correctly

## Security Best Practices

1. **Access Code**: Always use a strong, unique access code in production
2. **Environment Variables**: Never commit secrets to Git
3. **Admin Authentication**: Add authentication to `/admin` page for production
4. **Rate Limiting**: Keep rate limiting enabled to prevent abuse
5. **Database Access**: Limit database access to necessary personnel only
6. **Regular Updates**: Keep dependencies updated for security patches

## Support

For issues or questions:
- Check the [README.md](./README.md) for general information
- Review [README-DATABASE.md](./README-DATABASE.md) for database-specific help
- Check Vercel documentation for deployment issues
- Review Drizzle ORM documentation for database queries
