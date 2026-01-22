/**
 * Rate limiting utility
 * 
 * Simple in-memory rate limiter for development.
 * For production, use Vercel KV or a dedicated rate limiting service.
 */

// In-memory store for rate limiting (dev only)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per window

/**
 * Check if a request should be rate limited
 * 
 * @param identifier - Unique identifier (e.g., IP hash)
 * @returns Object with allowed status and reset time
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up old entries periodically (every 100 checks)
  if (Math.random() < 0.01) {
    const keysToDelete: string[] = [];
    rateLimitStore.forEach((value, key) => {
      if (value.resetAt < now) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => rateLimitStore.delete(key));
  }

  if (!record || record.resetAt < now) {
    // New window or expired window
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetAt,
    };
  }

  // Existing window
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  // Increment count
  record.count++;
  rateLimitStore.set(identifier, record);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Production rate limiter using Vercel KV (optional)
 * 
 * To use this:
 * 1. Install @vercel/kv: npm install @vercel/kv
 * 2. Set KV_REST_API_URL and KV_REST_API_TOKEN environment variables
 * 
 * This function will automatically fall back to in-memory rate limiting
 * if Vercel KV is not available.
 */
export async function checkRateLimitKV(
  identifier: string
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  // Check if KV/Redis environment variables are set
  // Vercel provides either REDIS_URL (direct connection) or KV_REST_API_URL + KV_REST_API_TOKEN (REST API)
  const hasRedisConnection = process.env.REDIS_URL || 
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  
  if (!hasRedisConnection) {
    // Fallback to in-memory if KV is not configured
    return checkRateLimit(identifier);
  }

  // Use dynamic import with string literal to avoid build-time resolution
  // This will only attempt to load the module at runtime
  try {
    // Dynamic import using string to prevent webpack from analyzing it
    const importPath = "@vercel/kv";
    const kvModule = await import(/* @vite-ignore */ importPath).catch(() => null);
    
    if (!kvModule || !kvModule.kv) {
      return checkRateLimit(identifier);
    }

    const { kv } = kvModule;
    const now = Date.now();
    const key = `rate_limit:${identifier}`;
    const windowStart = Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
    const windowKey = `${key}:${windowStart}`;

    // Get current count
    const count = ((await kv.get(windowKey)) as number | null) || 0;

    if (count >= RATE_LIMIT_MAX_REQUESTS) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: windowStart + RATE_LIMIT_WINDOW_MS,
      };
    }

    // Increment count
    await kv.incr(windowKey);
    await kv.expire(windowKey, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - count - 1,
      resetAt: windowStart + RATE_LIMIT_WINDOW_MS,
    };
  } catch (error) {
    // Fallback to in-memory if KV is not available or fails
    console.warn("Vercel KV not available, falling back to in-memory rate limiting:", error);
    return checkRateLimit(identifier);
  }
}

/**
 * Get the appropriate rate limiter based on environment
 */
export async function getRateLimiter(identifier: string) {
  // Use Vercel KV/Redis in production if available
  // Vercel provides either REDIS_URL or KV_REST_API_URL + KV_REST_API_TOKEN
  const hasRedisConnection = process.env.REDIS_URL || 
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  
  if (hasRedisConnection && process.env.NODE_ENV === "production") {
    return checkRateLimitKV(identifier);
  }
  
  // Use in-memory for development
  return checkRateLimit(identifier);
}
