/**
 * Supabase Edge Function: ai-generate
 *
 * Thin Gemini proxy:
 * - Resolves which Gemini API key to use (club BYOK > org BYOK > platform key)
 * - Calls Gemini REST API with provided prompt/model
 * - Logs usage to ai_usage_events
 * - Includes CORS protection and rate limiting
 *
 * IMPORTANT:
 * - Client sends prompt text; Edge Function keeps keys server-side
 * - Access is constrained by RLS via the user JWT (Authorization header)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
  corsJsonResponse,
  corsErrorResponse,
} from '../_shared/cors.ts';
import {
  checkRateLimit,
  getRateLimitKey,
  rateLimitExceededResponse,
  addRateLimitHeaders,
  RATE_LIMITS,
} from '../_shared/rateLimit.ts';
import { resolveGeminiKey, geminiGenerateText } from '../_shared/aiKeyResolver.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization') || '';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Get user for rate limiting
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // Check rate limit
    const rateLimitKey = getRateLimitKey(req, userId, 'ai-generate');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.AI_GENERATE);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult, corsHeaders);
    }

    const body = await req.json();
    const clubId = body?.clubId as string | undefined;
    const prompt = body?.prompt as string | undefined;
    const model = (body?.model as string | undefined) || 'gemini-2.5-flash';
    const action = (body?.action as string | undefined) || 'ai_generate';

    if (!clubId || !prompt) {
      return corsJsonResponse({ error: 'Missing clubId or prompt' }, req, 400);
    }

    // Check org-level hourly rate limit
    const { key, source, orgId } = await resolveGeminiKey(supabase, clubId);
    const orgRateLimitKey = `ai-generate-org:${orgId}`;
    const orgRateLimitResult = checkRateLimit(orgRateLimitKey, RATE_LIMITS.AI_GENERATE_ORG_HOURLY);

    if (!orgRateLimitResult.allowed) {
      return rateLimitExceededResponse(orgRateLimitResult, corsHeaders);
    }

    const text = await geminiGenerateText(key, model, prompt);

    // Usage logging (best-effort)
    try {
      await supabase.from('ai_usage_events').insert({
        org_id: orgId,
        club_id: clubId,
        user_id: userId ?? null,
        action,
        status: 'success',
        approx_input_chars: prompt.length,
        approx_output_chars: text.length,
        meta: { model, key_source: source },
      });
    } catch (_e) {
      // ignore logging errors
    }

    // Add rate limit headers to successful response
    const responseHeaders = addRateLimitHeaders(
      { ...corsHeaders, 'Content-Type': 'application/json' },
      rateLimitResult
    );

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Error in ai-generate:', error);
    return corsErrorResponse(error as Error, req, 500);
  }
});
