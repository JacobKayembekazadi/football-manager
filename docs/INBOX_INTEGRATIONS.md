# PitchSide AI — Email Inbox Integrations

> Technical documentation for Gmail and Outlook integrations

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Gmail Integration](#3-gmail-integration)
4. [Outlook Integration](#4-outlook-integration)
5. [Token Management](#5-token-management)
6. [Email Sync Process](#6-email-sync-process)
7. [Send Email Process](#7-send-email-process)
8. [Error Handling](#8-error-handling)
9. [Rate Limits & Quotas](#9-rate-limits--quotas)

---

## 1. Overview

PitchSide AI supports two email providers:
- **Gmail** (Google Workspace & personal)
- **Outlook** (Microsoft 365 & personal)

### Connection Types

| Type | Visibility | Access | Use Case |
|------|------------|--------|----------|
| **Private** | Owner only | User's own emails | Personal correspondence |
| **Shared** | All org members | Shared inbox | Team communications |
| **Master** | All org members | Primary shared | Main club inbox |

### Precedence Rules

For Master Inbox:
```
Club Master Connection → Org Master Connection
```

---

## 2. Architecture

### Data Flow

```
┌─────────────┐     ┌────────────────┐     ┌─────────────┐
│   Browser   │────▶│ Edge Functions │────▶│  Provider   │
│   (React)   │     │   (Deno)       │     │ (Gmail/MS)  │
└─────────────┘     └────────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Supabase   │
                    │  Database   │
                    └─────────────┘
```

### Edge Functions

| Function | Purpose |
|----------|---------|
| `email-oauth-start` | Generate OAuth authorization URL |
| `email-oauth-exchange` | Exchange code for tokens, store encrypted |
| `email-sync` | Fetch emails from provider |
| `email-send` | Send emails through provider |

### Database Tables

```sql
-- Connection metadata
email_connections (
  id, org_id, club_id, owner_user_id,
  provider, email_address, visibility, is_master,
  status, last_synced_at
)

-- Encrypted tokens (separate for security)
email_oauth_tokens (
  connection_id, provider,
  access_token_ciphertext, access_token_iv,
  refresh_token_ciphertext, refresh_token_iv,
  expires_at, scope
)

-- Synced emails
inbox_emails (
  id, org_id, club_id, connection_id,
  provider_id, from_name, from_email,
  subject, body, preview, received_at,
  is_read, category, visibility
)
```

---

## 3. Gmail Integration

### 3.1 Required Scopes

```typescript
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly', // Read emails
  'https://www.googleapis.com/auth/gmail.send',     // Send emails
];
```

### 3.2 OAuth Flow

**Step 1: Start OAuth**
```typescript
// email-oauth-start Edge Function
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', GMAIL_CLIENT_ID);
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', GMAIL_SCOPES.join(' '));
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');
authUrl.searchParams.set('state', encodeState({ orgId, clubId, visibility, isMaster }));
```

**Step 2: Exchange Code**
```typescript
// email-oauth-exchange Edge Function
const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    code,
    client_id: GMAIL_CLIENT_ID,
    client_secret: GMAIL_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  }),
});

const { access_token, refresh_token, expires_in } = await tokenResponse.json();
```

**Step 3: Get User Email**
```typescript
const userInfo = await fetch(
  'https://www.googleapis.com/oauth2/v2/userinfo',
  { headers: { Authorization: `Bearer ${access_token}` } }
);
const { email } = await userInfo.json();
```

### 3.3 Fetching Emails

```typescript
// email-sync Edge Function
const listResponse = await fetch(
  `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=in:inbox`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
const { messages } = await listResponse.json();

// Fetch each message's details
for (const msg of messages) {
  const detail = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const message = await detail.json();
  // Parse headers and body
}
```

### 3.4 Sending Emails

```typescript
// email-send Edge Function
const rawMessage = createMimeMessage(to, subject, body);
const encoded = btoa(rawMessage).replace(/\+/g, '-').replace(/\//g, '_');

await fetch(
  'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded }),
  }
);
```

### 3.5 Token Refresh

```typescript
async function refreshGmailToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  
  const { access_token, expires_in } = await response.json();
  // Update stored token
  return access_token;
}
```

---

## 4. Outlook Integration

### 4.1 Required Scopes

```typescript
const OUTLOOK_SCOPES = [
  'offline_access',  // Refresh tokens
  'Mail.Read',       // Read emails
  'Mail.Send',       // Send emails
];
```

### 4.2 OAuth Flow

**Step 1: Start OAuth**
```typescript
// email-oauth-start Edge Function
const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
authUrl.searchParams.set('client_id', OUTLOOK_CLIENT_ID);
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', OUTLOOK_SCOPES.join(' '));
authUrl.searchParams.set('state', encodeState({ orgId, clubId, visibility, isMaster }));
```

**Step 2: Exchange Code**
```typescript
// email-oauth-exchange Edge Function
const tokenResponse = await fetch(
  'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: OUTLOOK_CLIENT_ID,
      client_secret: OUTLOOK_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  }
);

const { access_token, refresh_token, expires_in } = await tokenResponse.json();
```

**Step 3: Get User Email**
```typescript
const userInfo = await fetch(
  'https://graph.microsoft.com/v1.0/me',
  { headers: { Authorization: `Bearer ${access_token}` } }
);
const { mail, userPrincipalName } = await userInfo.json();
const email = mail || userPrincipalName;
```

### 4.3 Fetching Emails

```typescript
// email-sync Edge Function
const response = await fetch(
  'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=50&$orderby=receivedDateTime desc',
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
const { value: messages } = await response.json();

for (const msg of messages) {
  // msg includes: id, subject, from, body, receivedDateTime, isRead
}
```

### 4.4 Sending Emails

```typescript
// email-send Edge Function
await fetch(
  'https://graph.microsoft.com/v1.0/me/sendMail',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject: subject,
        body: { contentType: 'Text', content: body },
        toRecipients: [{ emailAddress: { address: to } }],
      },
    }),
  }
);
```

### 4.5 Token Refresh

```typescript
async function refreshOutlookToken(refreshToken: string): Promise<string> {
  const response = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: OUTLOOK_CLIENT_ID,
        client_secret: OUTLOOK_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    }
  );
  
  const { access_token, expires_in } = await response.json();
  // Update stored token
  return access_token;
}
```

---

## 5. Token Management

### 5.1 Encryption

Tokens are encrypted with AES-256-GCM before storage:

```typescript
async function encryptToken(plaintext: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

async function decryptToken(ciphertext: string, iv: string, key: CryptoKey): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: Uint8Array.from(atob(iv), c => c.charCodeAt(0)) },
    key,
    Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
  );
  
  return new TextDecoder().decode(decrypted);
}
```

### 5.2 Key Derivation

```typescript
async function deriveKey(secret: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('pitchside-ai'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
```

### 5.3 Token Refresh Logic

```typescript
async function getValidAccessToken(connectionId: string): Promise<string> {
  const tokens = await getTokens(connectionId);
  
  // Check if access token is still valid (with 5 min buffer)
  if (tokens.expires_at > new Date(Date.now() + 5 * 60 * 1000)) {
    return decryptToken(tokens.access_token_ciphertext, tokens.access_token_iv);
  }
  
  // Refresh the token
  const refreshToken = await decryptToken(
    tokens.refresh_token_ciphertext,
    tokens.refresh_token_iv
  );
  
  const newAccessToken = tokens.provider === 'gmail'
    ? await refreshGmailToken(refreshToken)
    : await refreshOutlookToken(refreshToken);
  
  // Store new encrypted token
  await updateTokens(connectionId, newAccessToken);
  
  return newAccessToken;
}
```

---

## 6. Email Sync Process

### 6.1 Sync Flow

```
1. Client calls email-sync Edge Function
2. Function validates user and connection
3. Gets valid access token (refresh if needed)
4. Fetches recent messages from provider
5. Normalizes message format
6. Upserts into inbox_emails table
7. Updates last_synced_at on connection
8. Returns success/failure
```

### 6.2 Message Normalization

```typescript
interface NormalizedEmail {
  provider_id: string;      // Provider's message ID
  from_name: string;        // Sender display name
  from_email: string;       // Sender email address
  subject: string;          // Email subject
  body: string;             // Full body text
  preview: string;          // First 200 chars
  received_at: string;      // ISO timestamp
  is_read: boolean;         // Read status
}

function normalizeGmailMessage(msg: any): NormalizedEmail {
  const headers = msg.payload.headers;
  const from = headers.find(h => h.name === 'From')?.value || '';
  const subject = headers.find(h => h.name === 'Subject')?.value || '';
  const date = headers.find(h => h.name === 'Date')?.value || '';
  
  // Parse body from parts
  const body = extractBodyFromParts(msg.payload);
  
  return {
    provider_id: msg.id,
    from_name: extractName(from),
    from_email: extractEmail(from),
    subject,
    body,
    preview: body.substring(0, 200),
    received_at: new Date(date).toISOString(),
    is_read: !msg.labelIds?.includes('UNREAD'),
  };
}

function normalizeOutlookMessage(msg: any): NormalizedEmail {
  return {
    provider_id: msg.id,
    from_name: msg.from?.emailAddress?.name || '',
    from_email: msg.from?.emailAddress?.address || '',
    subject: msg.subject,
    body: msg.body?.content || '',
    preview: msg.bodyPreview || '',
    received_at: msg.receivedDateTime,
    is_read: msg.isRead,
  };
}
```

### 6.3 Deduplication

```sql
-- Upsert based on connection_id + provider_id
INSERT INTO inbox_emails (
  connection_id, org_id, club_id, provider_id,
  from_name, from_email, subject, body, preview,
  received_at, is_read, visibility
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
ON CONFLICT (connection_id, provider_id)
DO UPDATE SET
  is_read = EXCLUDED.is_read,
  updated_at = NOW();
```

---

## 7. Send Email Process

### 7.1 Send Flow

```
1. Client calls email-send Edge Function
2. Function validates user and permissions
3. Gets email record and connection
4. Gets valid access token
5. Sends through provider API
6. Updates email record (sent_at, status)
7. Returns success/failure
```

### 7.2 Reply Threading

For Gmail:
```typescript
// Include In-Reply-To and References headers
const headers = [
  ['In-Reply-To', originalMessageId],
  ['References', originalMessageId],
  ['Subject', `Re: ${originalSubject}`],
];
```

For Outlook:
```typescript
// Use reply endpoint
await fetch(
  `https://graph.microsoft.com/v1.0/me/messages/${originalMessageId}/reply`,
  {
    method: 'POST',
    headers: { ... },
    body: JSON.stringify({
      message: { ... },
      comment: replyContent,
    }),
  }
);
```

---

## 8. Error Handling

### 8.1 Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `invalid_grant` | Token expired/revoked | Re-authenticate |
| `insufficient_scope` | Missing permissions | Re-authorize with scopes |
| `rate_limit_exceeded` | Too many requests | Implement backoff |
| `invalid_request` | Malformed request | Check parameters |
| `server_error` | Provider issue | Retry with backoff |

### 8.2 Error Responses

```typescript
// Standard error response format
{
  error: string;        // Error code
  message: string;      // Human-readable message
  details?: any;        // Additional info
}
```

### 8.3 Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      if (!isRetryable(error)) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## 9. Rate Limits & Quotas

### 9.1 Gmail Limits

| Resource | Limit |
|----------|-------|
| Queries per day | 1,000,000,000 |
| Queries per 100 seconds per user | 250 |
| Sending emails per day | 500 (consumer) / 2000 (workspace) |

### 9.2 Outlook Limits

| Resource | Limit |
|----------|-------|
| Requests per minute | 10,000 |
| Requests per app per day | 50,000 |
| Messages per minute | 30 |

### 9.3 Handling Rate Limits

```typescript
// Check for rate limit response
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After') || '60';
  await new Promise(r => setTimeout(r, parseInt(retryAfter) * 1000));
  // Retry request
}
```

---

## Quick Reference

### OAuth URLs

| Provider | Authorization | Token |
|----------|---------------|-------|
| Gmail | `accounts.google.com/o/oauth2/v2/auth` | `oauth2.googleapis.com/token` |
| Outlook | `login.microsoftonline.com/common/oauth2/v2.0/authorize` | `login.microsoftonline.com/common/oauth2/v2.0/token` |

### API Endpoints

| Provider | Base URL |
|----------|----------|
| Gmail | `gmail.googleapis.com/gmail/v1` |
| Outlook | `graph.microsoft.com/v1.0` |

---

*Last Updated: December 2024*







