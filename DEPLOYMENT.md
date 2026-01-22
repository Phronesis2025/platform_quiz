# Deployment Guide

This guide covers everything you need to deploy and manage the Platform Quiz application on Vercel using Redis (Vercel KV) for data storage.

**Repository**: [https://github.com/Phronesis2025/platform_quiz](https://github.com/Phronesis2025/platform_quiz)

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Vercel KV (Redis) Setup](#vercel-kv-redis-setup)
3. [Environment Variables](#environment-variables)
4. [Access Code Management](#access-code-management)
5. [Data Retention & Privacy](#data-retention--privacy)
6. [Admin Features](#admin-features)
7. [Troubleshooting](#troubleshooting)

## Initial Setup

### Prerequisites

- Vercel account
- Node.js 18+ installed locally
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

## Vercel KV (Redis) Setup

### Step 1: Create KV Database

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database**
3. Select **KV** (Redis)
4. Choose a database name (e.g., "platform-quiz-kv")
5. Select a region closest to your users
6. Click **Create**

### Step 2: Get Connection Details

1. After creating the KV database, go to **Settings** tab
2. Scroll to **Storage** section
3. Find your KV database
4. Click on it to view details
5. Copy the following:
   - **REST API URL** (looks like `https://xxx.vercel-storage.com`)
   - **REST API Token** (a long token string)

### Step 3: Add Environment Variables

1. In your Vercel project, go to **Settings** > **Environment Variables**
2. Click **Add New** for each variable:
   - **Key**: `KV_REST_API_URL`
     - **Value**: Paste your REST API URL
     - **Environments**: Select all (Production, Preview, Development)
   - **Key**: `KV_REST_API_TOKEN`
     - **Value**: Paste your REST API Token
     - **Environments**: Select all (Production, Preview, Development)
3. Click **Save** for each variable

**Important**: After adding environment variables, you need to **redeploy** your application for changes to take effect.

## Environment Variables

### Required Variables

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `KV_REST_API_URL` | Vercel KV REST API URL | Vercel Dashboard > Storage > KV > Settings |
| `KV_REST_API_TOKEN` | Vercel KV REST API token | Vercel Dashboard > Storage > KV > Settings |
| `NEXT_PUBLIC_QUIZ_CODE` | Access code for quiz (optional) | Set your own secret code |

### Setting Environment Variables

#### Local Development

Create a `.env.local` file in the project root:

```env
KV_REST_API_URL=https://your-kv-instance.vercel-storage.com
KV_REST_API_TOKEN=your-kv-token-here
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
   - Example: `openssl rand -hex 16` (generates a 32-character hex string)

2. **Update in Vercel**:
   - Go to **Settings** > **Environment Variables**
   - Find `NEXT_PUBLIC_QUIZ_CODE`
   - Click **Edit**
   - Update the value
   - Click **Save**

3. **Redeploy**:
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment
   - Or push a new commit

4. **Notify users**: Share the new code with authorized users

**Note**: Users who have the old code stored in their browser's `sessionStorage` will need to clear it or enter the new code.

## Data Retention & Privacy

### How Data is Stored

Quiz submissions are stored in Vercel KV (Redis) with the following structure:

- **Key Pattern**: `submission:{id}` - Individual submission data (JSON)
- **Index**: `submissions:index` - Sorted set for ordering by creation date

Each submission includes:
- Quiz responses (raw answers)
- Computed role scores
- User metadata (name, team - optional)
- Request metadata (user agent, hashed IP address)

### Data Privacy

- **IP Addresses**: IP addresses are hashed using SHA-256 before storage
- **No Personal Data Required**: Name and team are optional fields
- **Access Control**: Use the access code feature to restrict who can take the quiz

### Viewing Stored Data

You can view submissions through:
1. **Admin Page** (`/admin`) - Web interface to view all submissions
2. **Vercel KV Dashboard** - Direct access to Redis data (requires Vercel account)

### Exporting Data

Use the **CSV Export** feature on the admin page to download all submissions.

### Deleting Data

To delete individual submissions or all data:

**Option 1: Using Vercel KV Dashboard**
1. Go to your Vercel project dashboard
2. Navigate to **Storage** > **KV**
3. Click on your KV database
4. Use the interface to delete keys

**Option 2: Programmatically**
You can add a delete function to the admin page or use the Vercel KV API directly.

**Option 3: Clear All Data**
To clear all submissions, delete all keys matching the pattern `submission:*` and the `submissions:index` key.

## Admin Features

### Accessing the Admin Page

Navigate to `/admin` on your deployed application.

**Note**: The admin page currently has no authentication. For production use, you should add authentication (e.g., Vercel's authentication or a custom solution).

### Viewing Submissions

The admin page displays all quiz submissions in a table with:
- Date/Time
- Name (if provided)
- Team (if provided)
- Primary Role
- Secondary Role
- Score Spread (difference between highest and lowest role scores)

### Filtering Submissions

1. **Filter by Team**:
   - Select a team from the "Team" dropdown
   - Only submissions from that team will be shown

2. **Filter by Primary Role**:
   - Select a role from the "Primary Role" dropdown
   - Only submissions with that primary role will be shown

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

**Error**: `KV_REST_API_URL` or `KV_REST_API_TOKEN` not found

**Solution**:
1. Verify `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set in Vercel environment variables
2. Check that the values are correct (no extra spaces, correct format)
3. Ensure the KV database is active in Vercel dashboard
4. Redeploy after adding environment variables

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
1. The rate limiter uses Vercel KV automatically if available
2. Adjust rate limit settings in `src/lib/rate-limit.ts`:
   - `RATE_LIMIT_MAX_REQUESTS`: Increase from 5 if needed
   - `RATE_LIMIT_WINDOW_MS`: Adjust time window
3. Ensure `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set for production rate limiting

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
3. Check that KV connection is working
4. Verify `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set correctly

### Data Not Persisting

**Symptoms**: Submissions are not being saved

**Solutions**:
1. Check that `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set correctly
2. Verify the KV database is active in Vercel dashboard
3. Check server logs for errors
4. Ensure the API route is working: Test `/api/submit-quiz` endpoint

## Security Best Practices

1. **Access Code**: Always use a strong, unique access code in production
2. **Environment Variables**: Never commit secrets to Git
3. **Admin Authentication**: Add authentication to `/admin` page for production
4. **Rate Limiting**: Keep rate limiting enabled to prevent abuse
5. **Database Access**: Limit KV access to necessary personnel only
6. **Regular Updates**: Keep dependencies updated for security patches

## Support

For issues or questions:
- Check the [README.md](./README.md) for general information
- Review Vercel KV documentation for Redis-specific help
- Check Vercel documentation for deployment issues
- Review the code comments in `src/lib/db.ts` for database operations
