/**
 * Shared CORS Configuration
 *
 * Provides secure CORS headers for all Edge Functions.
 * Restricts origins to production domains in production mode.
 */

// Production domains - update these with your actual domains
const PRODUCTION_ORIGINS = [
  'https://pitchside.ai',
  'https://app.pitchside.ai',
  'https://www.pitchside.ai',
  // Vercel preview deployments
  'https://football-manager-one-plum.vercel.app',
];

// Development origins (only allowed when not in production)
const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

/**
 * Get all allowed origins based on environment
 */
function getAllowedOrigins(): string[] {
  const isProduction = Deno.env.get('ENVIRONMENT') === 'production';

  if (isProduction) {
    return PRODUCTION_ORIGINS;
  }

  // In development/staging, allow both production and dev origins
  return [...PRODUCTION_ORIGINS, ...DEVELOPMENT_ORIGINS];
}

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();

  // Check exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Check for Vercel preview deployments (*.vercel.app)
  if (origin.endsWith('.vercel.app')) {
    // Only allow if it matches our project pattern
    const vercelPattern = /^https:\/\/football-manager-[a-z0-9-]+\.vercel\.app$/;
    return vercelPattern.test(origin);
  }

  return false;
}

/**
 * Get CORS headers for a request
 * Returns appropriate headers based on the request origin
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  const allowedOrigin = isOriginAllowed(origin) ? origin : PRODUCTION_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin || PRODUCTION_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightRequest(request: Request): Response {
  const corsHeaders = getCorsHeaders(request);
  return new Response('ok', { headers: corsHeaders });
}

/**
 * Create a JSON response with CORS headers
 */
export function corsJsonResponse(
  data: unknown,
  request: Request,
  status = 200
): Response {
  const corsHeaders = getCorsHeaders(request);
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Create an error response with CORS headers
 */
export function corsErrorResponse(
  error: string | Error,
  request: Request,
  status = 500
): Response {
  const message = error instanceof Error ? error.message : error;
  return corsJsonResponse({ error: message }, request, status);
}
