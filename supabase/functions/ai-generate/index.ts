/**
 * Supabase Edge Function: ai-generate
 *
 * Thin Gemini proxy:
 * - Resolves which Gemini API key to use (club BYOK > org BYOK > platform key)
 * - Calls Gemini REST API with provided prompt/model
 * - Logs usage to ai_usage_events
 *
 * IMPORTANT:
 * - Client sends prompt text; Edge Function keeps keys server-side
 * - Access is constrained by RLS via the user JWT (Authorization header)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function b64ToBytes(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToB64(bytes: Uint8Array) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

async function decryptSecret(ciphertextB64: string, ivB64: string): Promise<string> {
  const keyB64 = Deno.env.get('APP_ENCRYPTION_KEY');
  if (!keyB64) throw new Error('Missing APP_ENCRYPTION_KEY');

  const keyBytes = b64ToBytes(keyB64);
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
  const iv = b64ToBytes(ivB64);
  const ciphertext = b64ToBytes(ciphertextB64);
  const plaintextBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintextBuf);
}

async function resolveGeminiKey(supabase: any, clubId: string): Promise<{ key: string; source: string; orgId: string }> {
  // Determine orgId from club (RLS-protected)
  const { data: club, error: clubErr } = await supabase
    .from('clubs')
    .select('id, org_id')
    .eq('id', clubId)
    .single();
  if (clubErr || !club) throw new Error('Invalid club or access denied');

  const orgId = club.org_id as string;

  // Club override
  const { data: clubSettings } = await supabase
    .from('club_ai_settings')
    .select('mode, byok_key_ciphertext, byok_key_iv')
    .eq('club_id', clubId)
    .maybeSingle();

  if (
    clubSettings &&
    clubSettings.mode === 'byok' &&
    clubSettings.byok_key_ciphertext &&
    clubSettings.byok_key_iv
  ) {
    const key = await decryptSecret(clubSettings.byok_key_ciphertext, clubSettings.byok_key_iv);
    return { key, source: 'club_byok', orgId };
  }

  // Org default
  const { data: orgSettings } = await supabase
    .from('org_ai_settings')
    .select('mode, byok_key_ciphertext, byok_key_iv')
    .eq('org_id', orgId)
    .maybeSingle();

  if (
    orgSettings &&
    (orgSettings.mode === 'byok' || orgSettings.mode === 'hybrid') &&
    orgSettings.byok_key_ciphertext &&
    orgSettings.byok_key_iv
  ) {
    const key = await decryptSecret(orgSettings.byok_key_ciphertext, orgSettings.byok_key_iv);
    return { key, source: 'org_byok', orgId };
  }

  const platformKey = Deno.env.get('GEMINI_API_KEY');
  if (!platformKey) throw new Error('Missing GEMINI_API_KEY (platform managed)');
  return { key: platformKey, source: 'platform_managed', orgId };
}

async function geminiGenerateText(apiKey: string, model: string, prompt: string): Promise<string> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=` +
    encodeURIComponent(apiKey);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini error: ${res.status} ${txt}`);
  }

  const json = await res.json();
  const text =
    json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('') ??
    json?.candidates?.[0]?.content?.parts?.[0]?.text ??
    '';

  return text || 'Failed to generate content.';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json();
    const clubId = body?.clubId as string | undefined;
    const prompt = body?.prompt as string | undefined;
    const model = (body?.model as string | undefined) || 'gemini-2.5-flash';
    const action = (body?.action as string | undefined) || 'ai_generate';

    if (!clubId || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing clubId or prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { key, source, orgId } = await resolveGeminiKey(supabase, clubId);
    const text = await geminiGenerateText(key, model, prompt);

    // Usage logging (best-effort)
    try {
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('ai_usage_events').insert({
        org_id: orgId,
        club_id: clubId,
        user_id: userData.user?.id ?? null,
        action,
        status: 'success',
        approx_input_chars: prompt.length,
        approx_output_chars: text.length,
        meta: { model, key_source: source },
      });
    } catch (_e) {
      // ignore
    }

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-generate:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});






