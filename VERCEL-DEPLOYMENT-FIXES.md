# Vercel Deployment Fixes

This document addresses common Vercel deployment issues and their solutions.

## Common Issues and Fixes

### Issue 1: Build Fails with Database Connection Error

**Error**: `KV_REST_API_URL` or `KV_REST_API_TOKEN` not found

**Cause**: Next.js tries to statically generate API routes during build, and they attempt to connect to the database.

**Solution**: API routes are now marked with `export const dynamic = "force-dynamic"` to prevent static generation. However, the actual connection only happens at runtime, so this shouldn't cause build failures.

**Files Updated**:
- `app/api/submissions/route.ts` - Added `export const dynamic = "force-dynamic"`
- `app/api/submit-quiz/route.ts` - Added `export const dynamic = "force-dynamic"`

### Issue 2: Missing Environment Variables

**Error**: Build succeeds but runtime errors occur

**Solution**: Ensure these environment variables are set in Vercel:

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add:
   - `KV_REST_API_URL` (required) - Your Vercel KV REST API URL
   - `KV_REST_API_TOKEN` (required) - Your Vercel KV REST API Token
   - `NEXT_PUBLIC_QUIZ_CODE` (optional) - Access code for quiz

3. **Important**: After adding variables, trigger a new deployment:
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment
   - Or push a new commit

### Issue 3: TypeScript/Build Errors

**Error**: TypeScript compilation errors

**Solution**:
1. Run `npm run build` locally to see the exact error
2. Check that all dependencies are in `package.json`
3. Verify `tsconfig.json` is correct
4. Ensure Node.js version is 18+ (check in Vercel project settings)

### Issue 4: Module Not Found Errors

**Error**: Cannot find module '@vercel/kv'

**Cause**: The `@vercel/kv` package is not installed.

**Solution**: 
1. Install the package: `npm install @vercel/kv`
2. Ensure it's in `package.json` dependencies
3. Redeploy the application

### Issue 5: Build Warnings About Dynamic Imports

**Warning**: "Critical dependency: the request of a dependency is an expression"

**Cause**: The rate limiter uses dynamic imports for optional Vercel KV support.

**Solution**: This is a warning, not an error. The build will still succeed. The code handles missing KV gracefully.

## Quick Deployment Checklist

Before deploying to Vercel:

- [ ] All code is committed and pushed to GitHub
- [ ] Repository is connected to Vercel
- [ ] Vercel KV database is created
- [ ] `KV_REST_API_URL` environment variable is set in Vercel
- [ ] `KV_REST_API_TOKEN` environment variable is set in Vercel
- [ ] `NEXT_PUBLIC_QUIZ_CODE` is set (if using access code)
- [ ] Build passes locally: `npm run build`

## Verifying Deployment

After deployment:

1. **Check Build Logs**: 
   - Go to Vercel Dashboard > Deployments
   - Click on the deployment
   - Review build logs for any errors

2. **Test the Application**:
   - Visit your deployed URL
   - Test the quiz flow
   - Check admin page loads

3. **Check Runtime Logs**:
   - Go to Vercel Dashboard > Your Project > Logs
   - Look for any runtime errors

## Getting Help

If deployment still fails:

1. **Check Vercel Build Logs**: The error message will tell you exactly what's wrong
2. **Common Error Messages**:
   - "Module not found" → Check package.json dependencies, run `npm install`
   - "Type error" → Run `npm run build` locally to see TypeScript errors
   - "Missing environment variable" → Add it in Vercel dashboard
   - "Database connection failed" → Check KV_REST_API_URL and KV_REST_API_TOKEN are set correctly

3. **Share the Error**: Copy the exact error message from Vercel build logs for troubleshooting
