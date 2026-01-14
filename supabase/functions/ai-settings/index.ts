/**
 * Supabase Edge Function: ai-settings
 *
 * Stores BYOK keys encrypted and sets org/club AI mode.
 * - Org setting: org_ai_settings
 * - Club setting: club_ai_settings
 * - Includes CORS protection and rate limiting
 *
 * Expected env:
 * - APP_ENCRYPTION_KEY (base64 32 bytes) for AES-GCM encryption
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
  RATE_LIMITS,
} from '../_shared/rateLimit.ts';
import { encryptSecret } from '../_shared/encryption.ts';

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
    const rateLimitKey = getRateLimitKey(req, userId, 'ai-settings');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.AI_SETTINGS);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult, corsHeaders);
    }

    const body = await req.json();
    const scope = body?.scope as 'org' | 'club';
    const mode = body?.mode as string | undefined;
    const byokKey = (body?.byokKey as string | undefined)?.trim();
    const orgId = body?.orgId as string | undefined;
    const clubId = body?.clubId as string | undefined;

    if (!scope || !mode) {
      return corsJsonResponse({ error: 'Missing scope or mode' }, req, 400);
    }

    if (scope === 'org') {
      if (!orgId) {
        return corsJsonResponse({ error: 'Missing orgId' }, req, 400);
      }

      const payload: any = { org_id: orgId, mode };
      if (byokKey) {
        const enc = await encryptSecret(byokKey);
        payload.byok_key_ciphertext = enc.ciphertext;
        payload.byok_key_iv = enc.iv;
      }

      // Upsert
      const { error } = await supabase.from('org_ai_settings').upsert(payload, { onConflict: 'org_id' });
      if (error) throw error;

      return corsJsonResponse({ ok: true }, req, 200);
    }

    if (scope === 'club') {
      if (!clubId) {
        return corsJsonResponse({ error: 'Missing clubId' }, req, 400);
      }

      // Derive org_id from club (RLS-protected)
      const { data: club, error: clubErr } = await supabase
        .from('clubs')
        .select('id, org_id')
        .eq('id', clubId)
        .single();
      if (clubErr || !club) {
        throw new Error('Invalid club or access denied');
      }

      const payload: any = { club_id: clubId, org_id: club.org_id, mode };
      if (byokKey) {
        const enc = await encryptSecret(byokKey);
        payload.byok_key_ciphertext = enc.ciphertext;
        payload.byok_key_iv = enc.iv;
      }

      const { error } = await supabase.from('club_ai_settings').upsert(payload, { onConflict: 'club_id' });
      if (error) throw error;

      return corsJsonResponse({ ok: true }, req, 200);
    }

    return corsJsonResponse({ error: 'Invalid scope' }, req, 400);
  } catch (error) {
    console.error('Error in ai-settings:', error);
    return corsErrorResponse(error as Error, req, 500);
  }
});
