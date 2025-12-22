# PitchSide AI — Security Documentation

> Security architecture, data protection, and best practices

---

## Table of Contents

1. [Security Architecture Overview](#1-security-architecture-overview)
2. [Authentication](#2-authentication)
3. [Authorization & Access Control](#3-authorization--access-control)
4. [Data Protection](#4-data-protection)
5. [API Security](#5-api-security)
6. [Email Integration Security](#6-email-integration-security)
7. [AI Key Management](#7-ai-key-management)
8. [Infrastructure Security](#8-infrastructure-security)
9. [Security Checklist](#9-security-checklist)
10. [Incident Response](#10-incident-response)

---

## 1. Security Architecture Overview

### 1.1 Defense in Depth

PitchSide AI employs multiple security layers:

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│  - HTTPS only                                           │
│  - No sensitive data in localStorage                    │
│  - No API keys exposed                                  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase Auth                         │
│  - JWT-based sessions                                   │
│  - Secure token handling                                │
│  - Email verification (optional)                        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Row Level Security                     │
│  - All queries filtered by org_id                       │
│  - Role-based access (owner/admin/editor/viewer)        │
│  - User cannot access other orgs' data                  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Edge Functions                        │
│  - Server-side API key handling                         │
│  - Token encryption/decryption                          │
│  - OAuth token exchange                                 │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Key Security Principles

1. **Zero Trust:** Every request is verified
2. **Least Privilege:** Users only access what they need
3. **Defense in Depth:** Multiple security layers
4. **Encryption:** Data encrypted at rest and in transit
5. **Audit Logging:** All sensitive actions logged

---

## 2. Authentication

### 2.1 Authentication Flow

```
User → Login Form → Supabase Auth → JWT Token → Protected Routes
```

### 2.2 Session Management

- **JWT Tokens:** Short-lived access tokens
- **Refresh Tokens:** Secure token refresh mechanism
- **Session Storage:** Tokens stored in httpOnly cookies (when possible)
- **Auto-refresh:** Tokens refresh automatically before expiry

### 2.3 Password Requirements

- Minimum 6 characters
- No maximum length restriction
- Passwords hashed using bcrypt (via Supabase)

### 2.4 Protected Routes

All application routes require authentication:

```typescript
// In App.tsx
if (!session) {
  return <AuthScreen />;
}
```

---

## 3. Authorization & Access Control

### 3.1 Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Owner** | Full access, can delete org, manage all settings |
| **Admin** | Full feature access, can manage settings and members |
| **Editor** | Can create/edit content, players, fixtures |
| **Viewer** | Read-only access to all data |

### 3.2 Row Level Security (RLS)

All database tables have RLS policies:

```sql
-- Example: Users can only access their org's data
CREATE POLICY "org_members_only" ON clubs
  FOR ALL
  USING (is_org_member(org_id));
```

### 3.3 RLS Helper Functions

```sql
-- Check if user is member of org
CREATE FUNCTION is_org_member(p_org_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE;

-- Get user's role in org
CREATE FUNCTION org_role(p_org_id UUID) RETURNS TEXT AS $$
  SELECT role FROM org_members
  WHERE org_id = p_org_id AND user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Check if user is admin or above
CREATE FUNCTION is_org_admin(p_org_id UUID) RETURNS BOOLEAN AS $$
  SELECT COALESCE(org_role(p_org_id) IN ('owner', 'admin'), false);
$$ LANGUAGE sql STABLE;
```

### 3.4 Policy Examples

```sql
-- Only org members can read clubs
CREATE POLICY "clubs_select" ON clubs
  FOR SELECT USING (is_org_member(org_id));

-- Only editors+ can modify clubs
CREATE POLICY "clubs_modify" ON clubs
  FOR UPDATE USING (is_org_editor(org_id));

-- Only admins+ can delete clubs
CREATE POLICY "clubs_delete" ON clubs
  FOR DELETE USING (is_org_admin(org_id));

-- Private email connections only visible to owner
CREATE POLICY "email_private" ON email_connections
  FOR SELECT USING (
    visibility = 'shared' AND is_org_member(org_id)
    OR
    visibility = 'private' AND owner_user_id = auth.uid()
  );
```

---

## 4. Data Protection

### 4.1 Encryption at Rest

- **Database:** Supabase encrypts all data at rest
- **Sensitive Fields:** OAuth tokens encrypted with AES-256
- **Encryption Keys:** Stored as Edge Function secrets

### 4.2 Token Encryption

OAuth tokens are encrypted before storage:

```typescript
// Encryption (in Edge Function)
const iv = crypto.getRandomValues(new Uint8Array(12));
const key = await deriveKey(ENCRYPTION_KEY);
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  new TextEncoder().encode(plaintext)
);

// Storage format
{
  access_token_ciphertext: base64Encode(encrypted),
  access_token_iv: base64Encode(iv)
}
```

### 4.3 Data Isolation

- **Multi-tenant:** Each org's data completely isolated
- **No Cross-Org Access:** RLS prevents any data leakage
- **Audit Trail:** All access logged

### 4.4 Sensitive Data Handling

| Data Type | Storage | Access |
|-----------|---------|--------|
| Passwords | Hashed (bcrypt) | Never exposed |
| OAuth Tokens | Encrypted (AES-256) | Edge Functions only |
| API Keys (BYOK) | Encrypted (AES-256) | Edge Functions only |
| User Data | Plaintext (RLS protected) | Org members only |

---

## 5. API Security

### 5.1 Supabase Client Security

```typescript
// Only anon key exposed to client
const supabase = createClient(
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY
);

// RLS handles authorization
// No service role key in client
```

### 5.2 Edge Function Security

```typescript
// Edge Functions use service role for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Always verify user before operations
const { data: { user }, error } = await supabase.auth.getUser(jwt);
if (!user) throw new Error('Unauthorized');
```

### 5.3 CORS Configuration

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Configure for production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### 5.4 Input Validation

All inputs validated before processing:

```typescript
// Example validation
if (!orgId || typeof orgId !== 'string') {
  return new Response(
    JSON.stringify({ error: 'Invalid org_id' }),
    { status: 400 }
  );
}
```

---

## 6. Email Integration Security

### 6.1 OAuth Flow Security

```
User → App → Edge Function → Provider OAuth → Token Exchange → Encrypted Storage
```

1. **State Parameter:** Random state prevents CSRF
2. **Code Verifier:** PKCE flow when supported
3. **Server-side Exchange:** Tokens never exposed to client
4. **Encrypted Storage:** Tokens encrypted immediately

### 6.2 Token Refresh

- Access tokens short-lived (typically 1 hour)
- Refresh tokens used server-side only
- Automatic refresh before expiry

### 6.3 Scope Limitations

**Gmail Scopes:**
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- No access to delete or modify existing emails

**Outlook Scopes:**
- `Mail.Read`
- `Mail.Send`
- Minimal required permissions

### 6.4 Private vs Shared Connections

| Type | Visibility | Use Case |
|------|------------|----------|
| Private | Owner only | Personal inbox |
| Shared | All org members | Team inbox |
| Master | All org members | Primary shared inbox |

---

## 7. AI Key Management

### 7.1 Key Storage

```
Platform Key: GEMINI_API_KEY (Edge Function secret)
Org BYOK: org_ai_settings.byok_key_ciphertext (encrypted)
Club BYOK: club_ai_settings.byok_key_ciphertext (encrypted)
```

### 7.2 Key Resolution

```typescript
async function resolveAIKey(orgId: string, clubId?: string): Promise<string> {
  // 1. Check club BYOK
  if (clubId) {
    const clubSettings = await getClubAISettings(clubId);
    if (clubSettings?.mode === 'byok' && clubSettings.byok_key_ciphertext) {
      return decrypt(clubSettings.byok_key_ciphertext);
    }
  }
  
  // 2. Check org BYOK
  const orgSettings = await getOrgAISettings(orgId);
  if (orgSettings?.mode === 'byok' && orgSettings.byok_key_ciphertext) {
    return decrypt(orgSettings.byok_key_ciphertext);
  }
  
  // 3. Fall back to platform key
  return Deno.env.get('GEMINI_API_KEY')!;
}
```

### 7.3 Key Security Best Practices

- **Never log keys:** Even in debug mode
- **Rotate regularly:** Change keys periodically
- **Monitor usage:** Track API calls per org
- **Rate limiting:** Prevent abuse

---

## 8. Infrastructure Security

### 8.1 Network Security

- **HTTPS Only:** All traffic encrypted (TLS 1.3)
- **No HTTP:** Redirects enforced
- **HSTS:** Strict Transport Security headers

### 8.2 Deployment Security

- **Environment Variables:** Secrets not in code
- **CI/CD:** Automated, audited deployments
- **No Debug in Production:** Debug mode disabled

### 8.3 Dependency Security

- **Regular Updates:** Dependencies kept current
- **Vulnerability Scanning:** Automated security checks
- **Minimal Dependencies:** Only necessary packages

### 8.4 Supabase Security Features

- **Automatic Backups:** Point-in-time recovery
- **Connection Pooling:** PgBouncer protection
- **Rate Limiting:** Built-in request limits
- **DDoS Protection:** Cloudflare integration

---

## 9. Security Checklist

### 9.1 Pre-Deployment Checklist

- [ ] All API keys as environment secrets (not in code)
- [ ] RLS enabled on all tables
- [ ] RLS policies tested and working
- [ ] HTTPS enforced
- [ ] Debug mode disabled
- [ ] Error messages don't expose internals
- [ ] Input validation on all endpoints
- [ ] CORS configured for production domain
- [ ] Rate limiting configured
- [ ] Audit logging enabled

### 9.2 Ongoing Security

- [ ] Regular dependency updates
- [ ] Security patch monitoring
- [ ] Access log review
- [ ] API key rotation schedule
- [ ] Backup verification
- [ ] Incident response plan reviewed

### 9.3 User Security Recommendations

- [ ] Use strong, unique passwords
- [ ] Enable email verification
- [ ] Review connected accounts regularly
- [ ] Disconnect unused integrations
- [ ] Report suspicious activity

---

## 10. Incident Response

### 10.1 Detection

Monitor for:
- Unusual login patterns
- Failed authentication spikes
- Unexpected data access patterns
- API rate limit triggers

### 10.2 Response Steps

1. **Contain:** Isolate affected systems
2. **Assess:** Determine scope and impact
3. **Notify:** Alert affected users if needed
4. **Remediate:** Fix vulnerability
5. **Document:** Record incident details
6. **Review:** Prevent recurrence

### 10.3 Contact

For security issues:
- Email: security@pitchside.ai (example)
- Do not disclose publicly until resolved

---

## Security Updates

| Date | Change |
|------|--------|
| 2024-12-17 | Initial security documentation |
| 2024-12-17 | Added multi-tenant RLS policies |
| 2024-12-17 | Added email OAuth security |
| 2024-12-17 | Added BYOK key management |

---

*This document should be reviewed and updated regularly.*



