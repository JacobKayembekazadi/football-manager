/**
 * Supabase Edge Function: email-sync
 *
 * Syncs latest inbox emails for a given email_connection.
 * - Decrypts stored tokens
 * - Refreshes access token if needed (service role update)
 * - Fetches provider messages (Gmail / Outlook)
 * - Upserts into inbox_emails
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

function b64UrlToBytes(b64url: string) {
  const b64 = b64url.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  return b64ToBytes(b64);
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

async function encryptSecret(plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const keyB64 = Deno.env.get('APP_ENCRYPTION_KEY');
  if (!keyB64) throw new Error('Missing APP_ENCRYPTION_KEY');
  const keyBytes = b64ToBytes(keyB64);
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  return { ciphertext: bytesToB64(new Uint8Array(ciphertextBuf)), iv: bytesToB64(iv) };
}

function classifyEmail(subject: string, fromEmail: string): 'League' | 'Sponsor' | 'Fan' | 'Media' {
  const s = `${subject} ${fromEmail}`.toLowerCase();
  if (s.includes('league') || s.includes('fixtures') || s.includes('referee')) return 'League';
  if (s.includes('sponsor') || s.includes('partnership') || s.includes('contract')) return 'Sponsor';
  if (s.includes('fan') || s.includes('ticket') || s.includes('shirt')) return 'Fan';
  return 'Media';
}

async function refreshGmail(refreshToken: string) {
  const clientId = Deno.env.get('GMAIL_CLIENT_ID');
  const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('Missing GMAIL_CLIENT_ID/GMAIL_CLIENT_SECRET');

  const form = new URLSearchParams();
  form.set('client_id', clientId);
  form.set('client_secret', clientSecret);
  form.set('refresh_token', refreshToken);
  form.set('grant_type', 'refresh_token');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Gmail refresh failed: ${JSON.stringify(json)}`);
  return json as { access_token: string; expires_in: number; scope?: string; token_type: string };
}

async function refreshOutlook(refreshToken: string, redirectUri?: string) {
  const clientId = Deno.env.get('OUTLOOK_CLIENT_ID');
  const clientSecret = Deno.env.get('OUTLOOK_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('Missing OUTLOOK_CLIENT_ID/OUTLOOK_CLIENT_SECRET');

  const form = new URLSearchParams();
  form.set('client_id', clientId);
  form.set('client_secret', clientSecret);
  form.set('refresh_token', refreshToken);
  form.set('grant_type', 'refresh_token');
  if (redirectUri) form.set('redirect_uri', redirectUri);
  form.set('scope', 'offline_access https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read');

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Outlook refresh failed: ${JSON.stringify(json)}`);
  return json as { access_token: string; expires_in: number; scope?: string; token_type: string };
}

async function gmailListMessages(accessToken: string, maxResults: number) {
  const u = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  u.searchParams.set('maxResults', String(maxResults));
  const res = await fetch(u.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  const json = await res.json();
  if (!res.ok) throw new Error(`Gmail list failed: ${JSON.stringify(json)}`);
  return (json.messages || []) as Array<{ id: string; threadId: string }>;
}

function extractGmailHeader(headers: any[], name: string) {
  const h = headers.find((x) => (x.name || '').toLowerCase() === name.toLowerCase());
  return h?.value || '';
}

function decodeGmailBody(payload: any): string {
  // Prefer text/plain parts
  const stack: any[] = [payload];
  while (stack.length) {
    const node = stack.pop();
    if (node?.mimeType === 'text/plain' && node?.body?.data) {
      try {
        const bytes = b64UrlToBytes(node.body.data);
        return new TextDecoder().decode(bytes);
      } catch {
        // ignore
      }
    }
    const parts = node?.parts || [];
    for (const p of parts) stack.push(p);
  }
  return '';
}

async function gmailGetMessage(accessToken: string, messageId: string) {
  const u = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(messageId)}`);
  u.searchParams.set('format', 'full');
  const res = await fetch(u.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  const json = await res.json();
  if (!res.ok) throw new Error(`Gmail get failed: ${JSON.stringify(json)}`);
  return json;
}

async function outlookListMessages(accessToken: string, maxResults: number) {
  const u = new URL('https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages');
  u.searchParams.set('$top', String(maxResults));
  u.searchParams.set('$orderby', 'receivedDateTime desc');
  const res = await fetch(u.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  const json = await res.json();
  if (!res.ok) throw new Error(`Graph list failed: ${JSON.stringify(json)}`);
  return (json.value || []) as any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader) throw new Error('Missing Authorization');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json();
    const connectionId = body?.connectionId as string;
    const clubIdContext = (body?.clubId as string | undefined) ?? null;
    const maxResults = Math.min(Math.max(Number(body?.maxResults ?? 25), 1), 50);

    if (!connectionId) throw new Error('Missing connectionId');

    // Fetch connection (RLS-protected)
    const { data: conn, error: connErr } = await userClient
      .from('email_connections')
      .select('*')
      .eq('id', connectionId)
      .single();
    if (connErr || !conn) throw new Error('Connection not found or access denied');

    if (!conn.access_token_ciphertext || !conn.access_token_iv) throw new Error('Connection missing token data');
    const accessToken = await decryptSecret(conn.access_token_ciphertext, conn.access_token_iv);
    const refreshToken =
      conn.refresh_token_ciphertext && conn.refresh_token_iv
        ? await decryptSecret(conn.refresh_token_ciphertext, conn.refresh_token_iv)
        : null;

    let activeAccessToken = accessToken;

    const expiresAt = conn.expires_at ? new Date(conn.expires_at).getTime() : 0;
    const now = Date.now();
    const needsRefresh = refreshToken && expiresAt > 0 && expiresAt - now < 60_000;

    if (needsRefresh) {
      const refreshed =
        conn.provider === 'gmail'
          ? await refreshGmail(refreshToken!)
          : await refreshOutlook(refreshToken!, null);
      activeAccessToken = refreshed.access_token;

      const enc = await encryptSecret(activeAccessToken);
      await serviceClient
        .from('email_connections')
        .update({
          access_token_ciphertext: enc.ciphertext,
          access_token_iv: enc.iv,
          expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          status: 'active',
        })
        .eq('id', connectionId);
    }

    const emailsToUpsert: any[] = [];
    if (conn.provider === 'gmail') {
      const msgs = await gmailListMessages(activeAccessToken, maxResults);
      for (const m of msgs) {
        const full = await gmailGetMessage(activeAccessToken, m.id);
        const headers = full.payload?.headers || [];
        const subject = extractGmailHeader(headers, 'Subject') || '(no subject)';
        const fromRaw = extractGmailHeader(headers, 'From') || '';
        const fromEmailMatch = fromRaw.match(/<([^>]+)>/);
        const fromEmail = (fromEmailMatch?.[1] || fromRaw).trim();
        const fromName = fromEmailMatch ? fromRaw.replace(fromEmailMatch[0], '').trim().replaceAll('"', '') : fromEmail;
        const preview = full.snippet || '';
        const bodyText = decodeGmailBody(full.payload) || preview;
        const receivedAt = full.internalDate ? new Date(Number(full.internalDate)).toISOString() : new Date().toISOString();

        emailsToUpsert.push({
          club_id: clubIdContext ?? conn.club_id ?? null,
          connection_id: connectionId,
          provider: 'gmail',
          external_id: full.id,
          thread_id: full.threadId ?? null,
          from_name: fromName || fromEmail,
          from_email: fromEmail,
          subject,
          preview: preview.slice(0, 280),
          body: bodyText,
          received_at: receivedAt,
          category: classifyEmail(subject, fromEmail),
          is_read: false,
        });
      }
    } else {
      const msgs = await outlookListMessages(activeAccessToken, maxResults);
      for (const m of msgs) {
        const fromEmail = m.from?.emailAddress?.address || '';
        const fromName = m.from?.emailAddress?.name || fromEmail;
        const subject = m.subject || '(no subject)';
        const preview = m.bodyPreview || '';
        const bodyText = m.body?.content || preview;
        const receivedAt = m.receivedDateTime ? new Date(m.receivedDateTime).toISOString() : new Date().toISOString();

        emailsToUpsert.push({
          club_id: clubIdContext ?? conn.club_id ?? null,
          connection_id: connectionId,
          provider: 'outlook',
          external_id: m.id,
          thread_id: m.conversationId ?? null,
          from_name: fromName,
          from_email: fromEmail,
          subject,
          preview: preview.slice(0, 280),
          body: bodyText,
          received_at: receivedAt,
          category: classifyEmail(subject, fromEmail),
          is_read: false,
        });
      }
    }

    if (emailsToUpsert.length > 0) {
      const { error: upsertErr } = await userClient
        .from('inbox_emails')
        .upsert(emailsToUpsert, { onConflict: 'connection_id,external_id' });
      if (upsertErr) throw upsertErr;
    }

    // last_synced_at best-effort
    await serviceClient.from('email_connections').update({ last_synced_at: new Date().toISOString() }).eq('id', connectionId);

    return new Response(JSON.stringify({ ok: true, upserted: emailsToUpsert.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in email-sync:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});






