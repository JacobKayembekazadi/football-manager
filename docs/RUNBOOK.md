# PitchSide AI — Operations Runbook

> Operational procedures for setup, deployment, and troubleshooting

---

## Table of Contents

1. [Initial Setup](#1-initial-setup)
2. [Supabase Configuration](#2-supabase-configuration)
3. [OAuth Provider Setup](#3-oauth-provider-setup)
4. [Edge Function Deployment](#4-edge-function-deployment)
5. [Environment Variables](#5-environment-variables)
6. [Monitoring & Logging](#6-monitoring--logging)
7. [Troubleshooting Guide](#7-troubleshooting-guide)
8. [Maintenance Procedures](#8-maintenance-procedures)
9. [Disaster Recovery](#9-disaster-recovery)

---

## 1. Initial Setup

### 1.1 Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account
- Google Cloud account (for Gemini AI)
- Gmail OAuth credentials (optional)
- Microsoft Azure app registration (optional, for Outlook)

### 1.2 Clone and Install

```bash
# Clone repository
git clone https://github.com/your-org/pitchside-ai.git
cd pitchside-ai

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### 1.3 Local Development

```bash
# Start development server
npm run dev

# App available at http://localhost:5173
```

---

## 2. Supabase Configuration

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note down:
   - Project URL (`VITE_SUPABASE_URL`)
   - Anon public key (`VITE_SUPABASE_ANON_KEY`)
   - Service role key (for Edge Functions)

### 2.2 Apply Database Schema

**Option A: Supabase Dashboard**
1. Open SQL Editor in Supabase Dashboard
2. Copy contents of `database/schema.sql`
3. Run the SQL

**Option B: Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref <your-project-ref>

# Run migrations
supabase db push
```

### 2.3 Enable Row Level Security

RLS is enabled in the schema, but verify:

1. Go to Supabase Dashboard → Table Editor
2. Select each table
3. Verify "RLS Enabled" badge is shown
4. Review policies in "Policies" tab

### 2.4 Create Initial Data

```sql
-- Create test organization
INSERT INTO orgs (name, created_by) 
VALUES ('Demo Organization', '<your-auth-user-id>');

-- Add yourself as owner
INSERT INTO org_members (org_id, user_id, role)
VALUES ('<new-org-id>', '<your-auth-user-id>', 'owner');

-- Create test club
INSERT INTO clubs (org_id, name, nickname, slug, tone_context, primary_color, secondary_color)
VALUES (
  '<org-id>',
  'Demo FC',
  'Demo',
  'demo-fc',
  'Professional and ambitious',
  '#00f3ff',
  '#f72585'
);
```

---

## 3. OAuth Provider Setup

### 3.1 Gmail OAuth Setup

**Step 1: Create Google Cloud Project**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Gmail API:
   - APIs & Services → Library
   - Search "Gmail API"
   - Click Enable

**Step 2: Configure OAuth Consent Screen**
1. APIs & Services → OAuth consent screen
2. Select "External" or "Internal"
3. Fill app information:
   - App name: "PitchSide AI"
   - Support email: your email
   - Developer contact: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
5. Add test users if using "External" with unverified app

**Step 3: Create OAuth Credentials**
1. APIs & Services → Credentials
2. Create Credentials → OAuth client ID
3. Application type: Web application
4. Name: "PitchSide AI Production"
5. Authorized redirect URIs:
   - `https://your-project.supabase.co/functions/v1/email-oauth-exchange`
   - `http://localhost:54321/functions/v1/email-oauth-exchange` (dev)
6. Note Client ID and Client Secret

**Step 4: Set Edge Function Secrets**
```bash
supabase secrets set GMAIL_CLIENT_ID=<your-client-id>
supabase secrets set GMAIL_CLIENT_SECRET=<your-client-secret>
```

### 3.2 Outlook OAuth Setup

**Step 1: Register Azure Application**
1. Go to [portal.azure.com](https://portal.azure.com)
2. Azure Active Directory → App registrations
3. New registration:
   - Name: "PitchSide AI"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: Web, `https://your-project.supabase.co/functions/v1/email-oauth-exchange`

**Step 2: Configure API Permissions**
1. API permissions → Add permission
2. Microsoft Graph → Delegated permissions:
   - `Mail.Read`
   - `Mail.Send`
   - `offline_access`
3. Grant admin consent (if organizational)

**Step 3: Create Client Secret**
1. Certificates & secrets → New client secret
2. Description: "PitchSide Production"
3. Expiry: Choose appropriate duration
4. Copy the secret value immediately

**Step 4: Set Edge Function Secrets**
```bash
supabase secrets set OUTLOOK_CLIENT_ID=<application-client-id>
supabase secrets set OUTLOOK_CLIENT_SECRET=<client-secret-value>
```

---

## 4. Edge Function Deployment

### 4.1 List of Edge Functions

| Function | Purpose |
|----------|---------|
| `ai-generate` | AI content generation |
| `ai-settings` | AI configuration management |
| `email-oauth-start` | Initiate OAuth flow |
| `email-oauth-exchange` | Exchange OAuth code for tokens |
| `email-sync` | Sync emails from provider |
| `email-send` | Send emails via provider |

### 4.2 Deploy All Functions

```bash
# Deploy all functions at once
supabase functions deploy

# Or deploy individually
supabase functions deploy ai-generate
supabase functions deploy ai-settings
supabase functions deploy email-oauth-start
supabase functions deploy email-oauth-exchange
supabase functions deploy email-sync
supabase functions deploy email-send
```

### 4.3 Verify Deployment

```bash
# List deployed functions
supabase functions list

# Check function logs
supabase functions logs ai-generate
```

### 4.4 Test Edge Functions

```bash
# Test AI generation (replace with actual values)
curl -X POST 'https://your-project.supabase.co/functions/v1/ai-generate' \
  -H 'Authorization: Bearer <user-jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"orgId": "...", "clubId": "...", "action": "playerAnalysis", "payload": {...}}'
```

---

## 5. Environment Variables

### 5.1 Client-Side Variables (.env.local)

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5.2 Edge Function Secrets

Set these via Supabase CLI or Dashboard:

```bash
# AI
supabase secrets set GEMINI_API_KEY=your-gemini-api-key

# Encryption
supabase secrets set ENCRYPTION_KEY=32-byte-hex-string

# Gmail OAuth
supabase secrets set GMAIL_CLIENT_ID=your-gmail-client-id
supabase secrets set GMAIL_CLIENT_SECRET=your-gmail-client-secret

# Outlook OAuth
supabase secrets set OUTLOOK_CLIENT_ID=your-outlook-client-id
supabase secrets set OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
```

### 5.3 Generate Encryption Key

```bash
# Generate 32-byte random hex string
openssl rand -hex 32
```

### 5.4 Verify Secrets

```bash
# List set secrets (values hidden)
supabase secrets list
```

---

## 6. Monitoring & Logging

### 6.1 Supabase Dashboard Monitoring

- **Database:** Dashboard → Database → Monitor performance
- **Auth:** Dashboard → Authentication → Users, logs
- **Edge Functions:** Dashboard → Edge Functions → Logs

### 6.2 Custom Logging

AI usage logged to `ai_usage_events` table:

```sql
-- View recent AI usage
SELECT * FROM ai_usage_events
ORDER BY created_at DESC
LIMIT 100;

-- Usage by org
SELECT org_id, COUNT(*) as calls, SUM(approx_input_chars) as input_chars
FROM ai_usage_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY org_id;
```

### 6.3 Email Sync Status

```sql
-- Check email connection status
SELECT id, org_id, provider, email_address, status, last_synced_at
FROM email_connections
ORDER BY last_synced_at DESC;
```

### 6.4 Alerting (Optional)

Consider setting up:
- Supabase Webhooks for critical events
- External monitoring (Datadog, etc.)
- Error tracking (Sentry, etc.)

---

## 7. Troubleshooting Guide

### 7.1 Authentication Issues

**Problem:** User can't log in
```
Checks:
1. Verify email/password correct
2. Check Supabase Auth logs
3. Verify email confirmation status
4. Check rate limiting
```

**Problem:** Session expired unexpectedly
```
Checks:
1. JWT expiry settings
2. Refresh token validity
3. Client-side session handling
```

### 7.2 Database Issues

**Problem:** "Permission denied" errors
```
Checks:
1. Verify RLS policies
2. Check user's org_id matches data
3. Verify user role in org_members
4. Test with service role (temporarily)
```

**Problem:** Slow queries
```
Checks:
1. Check indexes exist
2. EXPLAIN ANALYZE the query
3. Review N+1 query patterns
4. Check connection pooling
```

### 7.3 Edge Function Issues

**Problem:** Function returns 500
```bash
# Check logs
supabase functions logs <function-name> --tail

# Common causes:
- Missing environment secret
- Invalid JSON in request
- Database connection issues
- Timeout (default 10s)
```

**Problem:** CORS errors
```
Checks:
1. Verify corsHeaders in function
2. Check request headers allowed
3. Verify function deployed with latest code
```

### 7.4 OAuth Issues

**Problem:** OAuth redirect fails
```
Checks:
1. Verify redirect URI matches exactly
2. Check OAuth credentials set correctly
3. Verify scopes granted
4. Check state parameter handling
```

**Problem:** Token refresh fails
```
Checks:
1. Check refresh token stored
2. Verify refresh token not expired
3. Check provider API status
4. Re-authenticate user
```

### 7.5 AI Issues

**Problem:** AI generation fails
```
Checks:
1. Verify API key valid
2. Check key precedence logic
3. Review API quota/limits
4. Check request payload format
```

**Problem:** Slow AI responses
```
Checks:
1. Model selection (use faster models)
2. Prompt length (shorter is faster)
3. Network latency
4. Consider caching common requests
```

---

## 8. Maintenance Procedures

### 8.1 Database Maintenance

**Weekly:**
```sql
-- Analyze tables for query optimization
ANALYZE;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
```

**Monthly:**
```sql
-- Clean old AI usage events (keep 90 days)
DELETE FROM ai_usage_events
WHERE created_at < NOW() - INTERVAL '90 days';

-- Clean expired email tokens (handled by provider, but cleanup)
UPDATE email_connections
SET status = 'expired'
WHERE expires_at < NOW() AND status = 'active';
```

### 8.2 Backup Verification

1. Go to Supabase Dashboard → Database → Backups
2. Verify daily backups running
3. Test point-in-time recovery (on staging)

### 8.3 Dependency Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Run tests after updating
npm test
```

### 8.4 Secret Rotation

**AI Keys:**
1. Generate new key in Google Cloud
2. Test new key works
3. Update Supabase secret
4. Revoke old key

**OAuth Secrets:**
1. Create new secret in provider console
2. Update Supabase secret
3. Monitor for issues
4. Remove old secret

### 8.5 Performance Review

Monthly:
- Review Edge Function execution times
- Check database query performance
- Review API error rates
- Check user session metrics

---

## 9. Disaster Recovery

### 9.1 Data Loss Recovery

1. **Stop writes** (maintenance mode)
2. **Identify scope** of data loss
3. **Restore from backup**:
   - Supabase Dashboard → Database → Backups
   - Select appropriate restore point
   - Restore to new database first (verify)
   - Then restore to production

### 9.2 Service Outage Recovery

**Supabase Outage:**
- Check [status.supabase.com](https://status.supabase.com)
- Enable maintenance mode in app
- Wait for recovery
- Verify data integrity

**OAuth Provider Outage:**
- Email sync/send will fail
- Core app functionality continues
- Monitor provider status
- Auto-recover when restored

### 9.3 Security Incident Recovery

1. **Isolate:** Revoke compromised credentials
2. **Assess:** Determine affected data/users
3. **Notify:** Alert affected users if required
4. **Remediate:** Fix vulnerability
5. **Recover:** Restore from clean backup if needed
6. **Document:** Full incident report

### 9.4 Contact Information

- **Supabase Support:** support@supabase.com
- **Google Cloud Support:** cloud.google.com/support
- **Microsoft Azure Support:** azure.microsoft.com/support

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm test                 # Run tests

# Supabase
supabase start           # Start local Supabase
supabase stop            # Stop local Supabase
supabase db push         # Push schema changes
supabase functions serve # Local function testing
supabase functions deploy # Deploy functions
supabase secrets set     # Set secrets
supabase secrets list    # List secrets
```

### Important URLs

| Service | URL |
|---------|-----|
| Supabase Dashboard | dashboard.supabase.com |
| Google Cloud Console | console.cloud.google.com |
| Azure Portal | portal.azure.com |
| Supabase Status | status.supabase.com |

---

*Last Updated: December 2024*



