/**
 * Supabase Edge Function: email-oauth-exchange
 *
 * Exchanges OAuth code for tokens and stores an encrypted email_connection.
 * Must be called from the client with the user's Supabase JWT (Authorization header),
 * because provider redirects back to the SPA, not directly to this function.
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

function b64UrlToStr(b64url: string) {
  const b64 = b64url.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  return new TextDecoder().decode(b64ToBytes(b64));
}

function b64UrlToBytes(b64url: string) {
  const b64 = b64url.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  return b64ToBytes(b64);
}

function bytesToB64(bytes: Uint8Array) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function bytesToB64Url(bytes: Uint8Array) {
  return bytesToB64(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function hmacSignB64Url(message: string): Promise<string> {
  const keyB64 = Deno.env.get('APP_ENCRYPTION_KEY');
  if (!keyB64) throw new Error('Missing APP_ENCRYPTION_KEY');
  const keyBytes = b64ToBytes(keyB64);
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return bytesToB64Url(new Uint8Array(sig));
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

async function exchangeGmail(code: string, redirectUri: string) {
  const clientId = Deno.env.get('GMAIL_CLIENT_ID');
  const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('Missing GMAIL_CLIENT_ID/GMAIL_CLIENT_SECRET');

  const form = new URLSearchParams();
  form.set('code', code);
  form.set('client_id', clientId);
  form.set('client_secret', clientSecret);
  form.set('redirect_uri', redirectUri);
  form.set('grant_type', 'authorization_code');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Gmail token exchange failed: ${JSON.stringify(json)}`);
  return json as { access_token: string; refresh_token?: string; expires_in: number; scope?: string; token_type: string };
}

async function exchangeOutlook(code: string, redirectUri: string) {
  const clientId = Deno.env.get('OUTLOOK_CLIENT_ID');
  const clientSecret = Deno.env.get('OUTLOOK_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('Missing OUTLOOK_CLIENT_ID/OUTLOOK_CLIENT_SECRET');

  const form = new URLSearchParams();
  form.set('client_id', clientId);
  form.set('client_secret', clientSecret);
  form.set('code', code);
  form.set('redirect_uri', redirectUri);
  form.set('grant_type', 'authorization_code');
  form.set('scope', 'offline_access https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read');

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Outlook token exchange failed: ${JSON.stringify(json)}`);
  return json as { access_token: string; refresh_token?: string; expires_in: number; scope?: string; token_type: string };
}

async function getGmailAddress(accessToken: string): Promise<string> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Gmail profile fetch failed: ${JSON.stringify(json)}`);
  return json.emailAddress as string;
}

async function getOutlookAddress(accessToken: string): Promise<string> {
  const res = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Graph /me failed: ${JSON.stringify(json)}`);
  return (json.mail || json.userPrincipalName) as string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader) throw new Error('Missing Authorization');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const body = await req.json();
    const code = body?.code as string;
    const state = body?.state as string;

    if (!code || !state) throw new Error('Missing code or state');

    const [stateBody, sig] = state.split('.');
    if (!stateBody || !sig) throw new Error('Invalid state');
    const expected = await hmacSignB64Url(stateBody);
    if (expected !== sig) throw new Error('Invalid state signature');

    const stateJson = b64UrlToStr(stateBody);
    const stateObj = JSON.parse(stateJson);

    const provider = (body?.provider as 'gmail' | 'outlook' | undefined) ?? (stateObj.provider as 'gmail' | 'outlook');
    if (!provider) throw new Error('Missing provider');
    if (stateObj.provider !== provider) throw new Error('Provider mismatch');

    const orgId = stateObj.orgId as string;
    const clubId = (stateObj.clubId as string | null) ?? null;
    const visibility = (stateObj.visibility as 'private' | 'shared') ?? 'private';
    const isMaster = !!stateObj.isMaster;
    const redirectUri = stateObj.redirectUri as string;

    let token: { access_token: string; refresh_token?: string; expires_in: number; scope?: string };
    if (provider === 'gmail') token = await exchangeGmail(code, redirectUri);
    else token = await exchangeOutlook(code, redirectUri);

    const emailAddress =
      provider === 'gmail' ? await getGmailAddress(token.access_token) : await getOutlookAddress(token.access_token);

    const encAccess = await encryptSecret(token.access_token);
    const encRefresh = token.refresh_token ? await encryptSecret(token.refresh_token) : null;

    const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();
    const scopes = token.scope ? token.scope.split(' ') : null;

    const { data: inserted, error: insertErr } = await supabase
      .from('email_connections')
      .insert({
        org_id: orgId,
        club_id: clubId,
        owner_user_id: userData.user.id,
        provider,
        email_address: emailAddress,
        visibility,
        is_master: isMaster,
        scopes,
        access_token_ciphertext: encAccess.ciphertext,
        access_token_iv: encAccess.iv,
        refresh_token_ciphertext: encRefresh?.ciphertext ?? null,
        refresh_token_iv: encRefresh?.iv ?? null,
        expires_at: expiresAt,
        status: 'active',
      })
      .select('id')
      .single();

    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ ok: true, connectionId: inserted.id, emailAddress }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in email-oauth-exchange:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


