/**
 * Supabase Edge Function: email-oauth-start
 *
 * Returns an OAuth authorization URL for Gmail/Outlook.
 * The redirect_uri points back to the SPA origin (/) so the client can exchange the code
 * by calling `email-oauth-exchange` with the user's Supabase session JWT.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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

function bytesToB64Url(bytes: Uint8Array) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function strToB64Url(str: string) {
  return bytesToB64Url(new TextEncoder().encode(str));
}

async function hmacSignB64Url(message: string): Promise<string> {
  const keyB64 = Deno.env.get('APP_ENCRYPTION_KEY');
  if (!keyB64) throw new Error('Missing APP_ENCRYPTION_KEY');
  const keyBytes = b64ToBytes(keyB64);
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return bytesToB64Url(new Uint8Array(sig));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const provider = body?.provider as 'gmail' | 'outlook';
    const orgId = body?.orgId as string;
    const clubId = (body?.clubId as string | undefined) ?? null;
    const visibility = (body?.visibility as 'private' | 'shared') ?? 'private';
    const isMaster = !!body?.isMaster;
    const returnTo = (body?.returnTo as string | undefined) ?? '/';
    const redirectUri = body?.redirectUri as string | undefined;

    if (!provider || !orgId || !redirectUri) {
      return new Response(JSON.stringify({ error: 'Missing provider, orgId, or redirectUri' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Redirect back to SPA; the app will exchange the code using the user's Supabase JWT.
    // The client supplies redirectUri (must be allowlisted by provider settings).
    const redirectUrl = new URL(redirectUri);
    if (!['http:', 'https:'].includes(redirectUrl.protocol)) {
      throw new Error('Invalid redirectUri protocol');
    }

    const statePayload = {
      provider,
      orgId,
      clubId,
      visibility,
      isMaster,
      returnTo,
      redirectUri,
      t: Date.now(),
    };

    const stateJson = JSON.stringify(statePayload);
    const stateBody = strToB64Url(stateJson);
    const sig = await hmacSignB64Url(stateBody);
    const state = `${stateBody}.${sig}`;

    let url = '';
    if (provider === 'gmail') {
      const clientId = Deno.env.get('GMAIL_CLIENT_ID');
      if (!clientId) throw new Error('Missing GMAIL_CLIENT_ID');
      const scopes = [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
      ].join(' ');
      const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      u.searchParams.set('client_id', clientId);
      u.searchParams.set('redirect_uri', redirectUri);
      u.searchParams.set('response_type', 'code');
      u.searchParams.set('scope', scopes);
      u.searchParams.set('access_type', 'offline');
      u.searchParams.set('prompt', 'consent');
      u.searchParams.set('state', state);
      url = u.toString();
    } else {
      const clientId = Deno.env.get('OUTLOOK_CLIENT_ID');
      if (!clientId) throw new Error('Missing OUTLOOK_CLIENT_ID');
      const scopes = [
        'offline_access',
        'https://graph.microsoft.com/Mail.ReadWrite',
        'https://graph.microsoft.com/Mail.Send',
        'https://graph.microsoft.com/User.Read',
      ].join(' ');
      const u = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
      u.searchParams.set('client_id', clientId);
      u.searchParams.set('response_type', 'code');
      u.searchParams.set('redirect_uri', redirectUri);
      u.searchParams.set('response_mode', 'query');
      u.searchParams.set('scope', scopes);
      u.searchParams.set('state', state);
      url = u.toString();
    }

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in email-oauth-start:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


