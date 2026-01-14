/**
 * Rate Limiting Utility
 *
 * Provides in-memory rate limiting for Edge Functions.
 * Uses a sliding window algorithm with automatic cleanup.
 *
 * Note: This is per-instance rate limiting. For distributed rate limiting
 * across multiple Edge Function instances, consider using Supabase's
 * built-in rate limiting or an external service like Upstash Redis.
 */

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;   // Seconds until retry (only if blocked)
}

// In-memory store for rate limiting
// Note: This resets when the Edge Function cold starts
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old entries periodically (every 100 checks)
let checkCount = 0;
const CLEANUP_INTERVAL = 100;
const MAX_STORE_SIZE = 10000; // Prevent memory issues

function cleanupStore(windowMs: number): void {
  const now = Date.now();
  const expiredThreshold = now - windowMs * 2; // Keep some buffer

  for (const [key, record] of rateLimitStore.entries()) {
    if (record.windowStart < expiredThreshold) {
      rateLimitStore.delete(key);
    }
  }

  // If still too large, remove oldest entries
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    const entries = Array.from(rateLimitStore.entries());
    entries.sort((a, b) => a[1].windowStart - b[1].windowStart);
    const toRemove = entries.slice(0, Math.floor(MAX_STORE_SIZE / 2));
    for (const [key] of toRemove) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if a request is within rate limits
 *
 * @param key - Unique identifier for rate limiting (e.g., user ID, IP, org ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with remaining requests and reset time
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();

  // Periodic cleanup
  checkCount++;
  if (checkCount >= CLEANUP_INTERVAL) {
    checkCount = 0;
    cleanupStore(config.windowMs);
  }

  const record = rateLimitStore.get(key);
  const windowStart = now;
  const resetAt = now + config.windowMs;

  // No existing record or window expired - start fresh
  if (!record || record.windowStart + config.windowMs < now) {
    rateLimitStore.set(key, { count: 1, windowStart });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Within current window - increment count
  record.count++;
  const remaining = Math.max(0, config.maxRequests - record.count);
  const recordResetAt = record.windowStart + config.windowMs;

  if (record.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: recordResetAt,
      retryAfter: Math.ceil((recordResetAt - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining,
    resetAt: recordResetAt,
  };
}

/**
 * Generate rate limit key from request
 * Uses combination of user ID (from auth) and IP address
 */
export function getRateLimitKey(
  request: Request,
  userId?: string,
  prefix = 'global'
): string {
  // Try to get user ID from authorization header (already authenticated)
  const userPart = userId || 'anonymous';

  // Get IP from various headers (Cloudflare, Vercel, etc.)
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  return `${prefix}:${userPart}:${ip}`;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Record<string, string>,
  result: RateLimitResult
): Record<string, string> {
  return {
    ...headers,
    'X-RateLimit-Limit': result.remaining.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
  };
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitExceededResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  const headers = addRateLimitHeaders(
    { ...corsHeaders, 'Content-Type': 'application/json' },
    result
  );

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please retry after ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    }),
    { status: 429, headers }
  );
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // AI generation - 20 requests per minute per user
  AI_GENERATE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
  },

  // AI generation - 100 requests per hour per org (burst protection)
  AI_GENERATE_ORG_HOURLY: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
  },

  // Fan sentiment - 10 requests per minute (expensive operation)
  FAN_SENTIMENT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },

  // Email sending - 50 emails per hour
  SEND_EMAIL: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
  },

  // AI settings - 20 changes per hour
  AI_SETTINGS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
  },

  // Image generation - 10 per minute (expensive)
  AI_GENERATE_IMAGE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
} as const;
