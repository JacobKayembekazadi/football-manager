/**
 * Supabase Edge Function: email-send
 *
 * Sends a reply for an inbox_emails row using the owning email_connection.
 * - Decrypts access/refresh tokens
 * - Refreshes token if needed (service role update)
 * - Sends via Gmail API or Microsoft Graph
 * - Marks sent_at + reply_draft on inbox_emails
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

function bytesToB64Url(bytes: Uint8Array) {
  return bytesToB64(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
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
  return json as { access_token: string; expires_in: number; token_type: string };
}

async function refreshOutlook(refreshToken: string) {
  const clientId = Deno.env.get('OUTLOOK_CLIENT_ID');
  const clientSecret = Deno.env.get('OUTLOOK_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('Missing OUTLOOK_CLIENT_ID/OUTLOOK_CLIENT_SECRET');

  const form = new URLSearchParams();
  form.set('client_id', clientId);
  form.set('client_secret', clientSecret);
  form.set('refresh_token', refreshToken);
  form.set('grant_type', 'refresh_token');
  form.set('scope', 'offline_access https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read');

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Outlook refresh failed: ${JSON.stringify(json)}`);
  return json as { access_token: string; expires_in: number; token_type: string };
}

async function sendGmail(accessToken: string, to: string, subject: string, body: string) {
  const rfc822 = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=\"UTF-8\"\r\n\r\n${body}`;
  const raw = bytesToB64Url(new TextEncoder().encode(rfc822));

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Gmail send failed: ${JSON.stringify(json)}`);
}

async function sendOutlook(accessToken: string, to: string, subject: string, body: string) {
  const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'Text', content: body },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Outlook send failed: ${res.status} ${txt}`);
  }
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
    const emailId = body?.emailId as string;
    const replyContent = body?.replyContent as string;

    if (!emailId || !replyContent) throw new Error('Missing emailId or replyContent');

    const { data: emailRow, error: emailErr } = await userClient
      .from('inbox_emails')
      .select('*')
      .eq('id', emailId)
      .single();
    if (emailErr || !emailRow) throw new Error('Email not found or access denied');

    const connectionId = emailRow.connection_id as string;
    const { data: conn, error: connErr } = await userClient
      .from('email_connections')
      .select('*')
      .eq('id', connectionId)
      .single();
    if (connErr || !conn) throw new Error('Connection not found or access denied');

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
      const refreshed = conn.provider === 'gmail' ? await refreshGmail(refreshToken!) : await refreshOutlook(refreshToken!);
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

    const to = emailRow.from_email as string;
    const subjectBase = (emailRow.subject as string) || '(no subject)';
    const subject = subjectBase.toLowerCase().startsWith('re:') ? subjectBase : `Re: ${subjectBase}`;

    if (conn.provider === 'gmail') {
      await sendGmail(activeAccessToken, to, subject, replyContent);
    } else {
      await sendOutlook(activeAccessToken, to, subject, replyContent);
    }

    await userClient
      .from('inbox_emails')
      .update({ sent_at: new Date().toISOString(), reply_draft: replyContent })
      .eq('id', emailId);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in email-send:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});




