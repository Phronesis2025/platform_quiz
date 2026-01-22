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

After creating the KV database, you need to get the connection credentials. Here are detailed steps:

**Method 1: Check Environment Variables (Easiest - Recommended)**

Vercel automatically adds the Redis connection variables when you create the KV database:

1. Go to **Settings** > **Environment Variables**
2. Look for `REDIS_URL` (most common) or `KV_REST_API_URL` and `KV_REST_API_TOKEN`
3. **If they're there**: Perfect! Vercel auto-configured them. You can skip to Step 3.
4. **If they're not there**: Continue with the methods below

**Method 2: From the Storage Tab**

1. In your Vercel project dashboard, go to the **Storage** tab
2. You should see your KV database listed (e.g., "platform-quiz-kv")
3. Click on the database name to open it
4. You'll see a page with database details. Look for:
   - **REDIS_URL** or **Connection String** - Direct Redis connection
     - Format: `redis://default:password@host:port`
   - **OR REST API URL** - This is your `KV_REST_API_URL` (if using REST API)
     - Format: `https://xxx.vercel-storage.com`
   - **REST API Token** - This is your `KV_REST_API_TOKEN` (if using REST API)
     - This is a long alphanumeric string
     - Click the "Show" or "Reveal" button if it's hidden

**Method 3: From Project Settings**

1. Go to your Vercel project dashboard
2. Click on the **Settings** tab
3. Scroll down to the **Storage** section
4. Find your KV database in the list
5. Click on the database name
6. You'll see the connection details including:
   - `REDIS_URL` (direct connection string) - OR
   - REST API URL and Token (if using REST API)
7. Copy the values you see

**Method 4: Using Vercel CLI (Easiest for Local Development)**

This automatically pulls all environment variables including Redis connection:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Pull all environment variables (includes REDIS_URL and VERCEL_OIDC_TOKEN)
vercel env pull .env.local
```

This will automatically create/update your `.env.local` file with all the correct variables!

**Note**: When you run `vercel env pull`, you'll get:
- `REDIS_URL` - Your Redis connection string (required for the app)
- `VERCEL_OIDC_TOKEN` - Vercel CLI authentication token (not needed by the app, but safe to keep)

**Important Notes:**
- Vercel usually provides `REDIS_URL` (direct connection string)
- Format: `redis://default:password@host:port`
- If you see `KV_REST_API_URL` instead, you'll also need `KV_REST_API_TOKEN`
- The `@vercel/kv` package automatically detects and uses whichever is available
- **You usually don't need to manually copy these** - use `vercel env pull` instead

### Step 3: Add Environment Variables

**Vercel Auto-Configures This!**

When you create a KV database, Vercel **automatically** adds the connection variables:

1. Go to **Settings** > **Environment Variables**
2. Look for `REDIS_URL` (most common) or `KV_REST_API_URL` and `KV_REST_API_TOKEN`
3. **If they're already there**: Perfect! Vercel auto-configured them. You're done! ✅
4. **If they're not there**: This is unusual - try refreshing the page or check if the database was created correctly

**Manual Setup (usually not needed):**

Only do this if Vercel didn't auto-configure the variables:

1. In your Vercel project, go to **Settings** > **Environment Variables**
2. Click **Add New** for the variable:
   - **If you have `REDIS_URL`**: 
     - **Key**: `REDIS_URL`
     - **Value**: Your Redis connection string (from Step 2)
     - **Environments**: Select all (Production, Preview, Development)
   - **If you have REST API credentials**:
     - **Key**: `KV_REST_API_URL`
     - **Value**: Your REST API URL
     - **Key**: `KV_REST_API_TOKEN`
     - **Value**: Your REST API Token
     - **Environments**: Select all (Production, Preview, Development)
3. Click **Save** for each variable

**Important**: After adding environment variables, you need to **redeploy** your application for changes to take effect.

## Environment Variables

### Required Variables

Vercel automatically provides Redis connection variables when you create a KV database. You'll get **one of these options**:

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `REDIS_URL` | Direct Redis connection string (most common) | Automatically provided by Vercel |
| `KV_REST_API_URL` | Vercel KV REST API URL (alternative) | Vercel Dashboard > Storage > KV > Settings |
| `KV_REST_API_TOKEN` | Vercel KV REST API token (if using REST API) | Vercel Dashboard > Storage > KV > Settings |
| `NEXT_PUBLIC_QUIZ_CODE` | Access code for quiz (optional) | Set your own secret code |

**Note**: The `@vercel/kv` package automatically detects and uses whichever variables Vercel provides. You don't need to manually set these - Vercel does it automatically when you create the KV database.

### Setting Environment Variables

#### Local Development

**Option 1: Pull from Vercel (Recommended)**

Use Vercel CLI to automatically pull all environment variables:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login and link your project
vercel login
vercel link

# Pull all environment variables (includes REDIS_URL and VERCEL_OIDC_TOKEN)
vercel env pull .env.local
```

**What you'll get:**
- `REDIS_URL` - Redis connection string (required for the app)
- `VERCEL_OIDC_TOKEN` - Vercel CLI authentication token (not needed by the app, but safe to keep in `.env.local`)

**Option 2: Manual Setup**

If you prefer to set it up manually, create a `.env.local` file:

```env
# Vercel will provide one of these when you create the KV database:
# Either REDIS_URL (direct connection) or KV_REST_API_URL + KV_REST_API_TOKEN (REST API)
REDIS_URL=redis://default:password@host:port
# OR
# KV_REST_API_URL=https://your-kv-instance.vercel-storage.com
# KV_REST_API_TOKEN=your-kv-token-here

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

**Error**: `REDIS_URL` or `KV_REST_API_URL` not found

**Solution**:
1. **Check if Vercel auto-configured it**: Go to **Settings** > **Environment Variables** and look for `REDIS_URL` (most common) or `KV_REST_API_URL` and `KV_REST_API_TOKEN`
2. If they're missing, the KV database might not be properly linked to your project
3. Try re-linking: Go to **Storage** tab → Click your KV database → Make sure it's linked to your project
4. Check that the values are correct (no extra spaces, correct format)
5. Ensure the KV database is active in Vercel dashboard
6. Redeploy after verifying environment variables

### Can't Find KV Connection Details

**Symptoms**: You created the KV database but can't find the REST API URL or Token

**Solutions**:

1. **Check if Vercel Auto-Configured It**:
   - Vercel **automatically** adds Redis environment variables when you create the database
   - Go to **Settings** > **Environment Variables**
   - Look for `REDIS_URL` (most common) or `KV_REST_API_URL` and `KV_REST_API_TOKEN`
   - They should already be there! If not, the database might not be properly linked

2. **Try Different Navigation Paths**:
   - **Path 1**: Storage tab → Click database name → Look for "Connection" or "API" section
   - **Path 2**: Settings tab → Storage section → Click database → Connection details
   - **Path 3**: Settings tab → Environment Variables → Check if auto-added

3. **Check the Database Overview Page**:
   - When you click on your KV database, you should see an overview page
   - Look for tabs or sections like: "Overview", "Settings", "API", "Connection"
   - You'll see either:
     - `REDIS_URL` (direct connection string) - OR
     - REST API URL and Token in the "API" or "Connection" section

4. **Use Vercel CLI** (if dashboard is unclear):
   ```bash
   # Install and login to Vercel CLI
   npm i -g vercel
   vercel login
   vercel link
   
   # Pull environment variables (includes REDIS_URL and VERCEL_OIDC_TOKEN)
   vercel env pull .env.local
   ```
   
   This will create/update your `.env.local` with:
   - `REDIS_URL` - Your Redis connection (required)
   - `VERCEL_OIDC_TOKEN` - Vercel CLI token (not needed by app, but safe to keep)

5. **Contact Vercel Support**:
   - If you still can't find the credentials, Vercel's interface may have changed
   - Check the [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
   - Or contact Vercel support for assistance

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
3. Ensure `REDIS_URL` (or `KV_REST_API_URL` and `KV_REST_API_TOKEN`) are set for production rate limiting

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
4. Verify `REDIS_URL` (or `KV_REST_API_URL` and `KV_REST_API_TOKEN`) are set correctly

### Data Not Persisting

**Symptoms**: Submissions are not being saved

**Solutions**:
1. Check that `REDIS_URL` (or `KV_REST_API_URL` and `KV_REST_API_TOKEN`) are set correctly
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
