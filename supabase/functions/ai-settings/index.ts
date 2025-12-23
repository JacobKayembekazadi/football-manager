/**
 * Supabase Edge Function: ai-settings
 *
 * Stores BYOK keys encrypted and sets org/club AI mode.
 * - Org setting: org_ai_settings
 * - Club setting: club_ai_settings
 *
 * Expected env:
 * - APP_ENCRYPTION_KEY (base64 32 bytes) for AES-GCM encryption
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function bytesToB64(bytes: Uint8Array) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64ToBytes(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function encryptSecret(plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const keyB64 = Deno.env.get('APP_ENCRYPTION_KEY');
  if (!keyB64) throw new Error('Missing APP_ENCRYPTION_KEY');
  const keyBytes = b64ToBytes(keyB64);
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  return { ciphertext: bytesToB64(new Uint8Array(ciphertextBuf)), iv: bytesToB64(iv) };
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
    const scope = body?.scope as 'org' | 'club';
    const mode = body?.mode as string | undefined;
    const byokKey = (body?.byokKey as string | undefined)?.trim();
    const orgId = body?.orgId as string | undefined;
    const clubId = body?.clubId as string | undefined;

    if (!scope || !mode) {
      return new Response(JSON.stringify({ error: 'Missing scope or mode' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (scope === 'org') {
      if (!orgId) {
        return new Response(JSON.stringify({ error: 'Missing orgId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let payload: any = { org_id: orgId, mode };
      if (byokKey) {
        const enc = await encryptSecret(byokKey);
        payload.byok_key_ciphertext = enc.ciphertext;
        payload.byok_key_iv = enc.iv;
      }

      // Upsert
      const { error } = await supabase.from('org_ai_settings').upsert(payload, { onConflict: 'org_id' });
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (scope === 'club') {
      if (!clubId) {
        return new Response(JSON.stringify({ error: 'Missing clubId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // derive org_id from club (RLS-protected)
      const { data: club, error: clubErr } = await supabase
        .from('clubs')
        .select('id, org_id')
        .eq('id', clubId)
        .single();
      if (clubErr || !club) throw new Error('Invalid club or access denied');

      let payload: any = { club_id: clubId, org_id: club.org_id, mode };
      if (byokKey) {
        const enc = await encryptSecret(byokKey);
        payload.byok_key_ciphertext = enc.ciphertext;
        payload.byok_key_iv = enc.iv;
      }

      const { error } = await supabase.from('club_ai_settings').upsert(payload, { onConflict: 'club_id' });
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid scope' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-settings:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});






