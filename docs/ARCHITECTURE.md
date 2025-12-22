# Architecture Documentation

**Last Updated**: 2024-12-17  
**Version**: 2.0.0  
**Purpose**: Complete system architecture documentation  
**For LLMs**: Use this to understand the overall system design and data flow

---

## System Overview

PitchSide AI is a **multi-tenant SaaS platform** for football club media management. The system supports:

- **Organizations (workspaces)** that can contain multiple clubs
- **Role-based access control** (owner, admin, editor, viewer)
- **AI-powered content generation** with managed and BYOK key options
- **Email integrations** (Gmail, Outlook) with private and shared inboxes

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            User Browser                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    React Application (Vite)                         │ │
│  │                                                                      │ │
│  │   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐       │ │
│  │   │AuthScreen│   │Workspace │   │  Main    │   │ Settings │       │ │
│  │   │          │   │  Gate    │   │  Views   │   │  View    │       │ │
│  │   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘       │ │
│  │        └──────────────┴──────────────┴──────────────┘              │ │
│  │                              │                                      │ │
│  │                    ┌─────────▼─────────┐                           │ │
│  │                    │   Service Layer   │                           │ │
│  │                    └─────────┬─────────┘                           │ │
│  │                              │                                      │ │
│  └──────────────────────────────┼──────────────────────────────────────┘ │
└──────────────────────────────────┼──────────────────────────────────────────┘
                                   │
     ┌─────────────────────────────┼─────────────────────────────┐
     │                             │                             │
     ▼                             ▼                             ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    Supabase      │     │  Edge Functions  │     │  External APIs   │
│                  │     │                  │     │                  │
│  ┌────────────┐  │     │  ┌────────────┐  │     │  ┌────────────┐  │
│  │ PostgreSQL │  │     │  │ai-generate │  │     │  │Gemini API  │  │
│  │ (with RLS) │  │     │  │ai-settings │  │     │  │            │  │
│  ├────────────┤  │◄───►│  │email-oauth │  │◄───►│  ├────────────┤  │
│  │   Auth     │  │     │  │email-sync  │  │     │  │Gmail API   │  │
│  ├────────────┤  │     │  │email-send  │  │     │  │            │  │
│  │ Real-time  │  │     │  └────────────┘  │     │  ├────────────┤  │
│  └────────────┘  │     │                  │     │  │MS Graph    │  │
│                  │     │                  │     │  └────────────┘  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool |
| Tailwind CSS | 3.x | Styling |
| Lucide React | - | Icons |

### Backend (Supabase)
| Component | Purpose |
|-----------|---------|
| PostgreSQL | Primary database |
| Supabase Auth | Authentication |
| Row Level Security | Multi-tenant isolation |
| Real-time | Live data updates |
| Edge Functions | Server-side processing |
| Storage | File storage (future) |

### AI Integration
| Service | Purpose |
|---------|---------|
| Google Gemini 2.5 | Text generation |
| Google Veo | Video generation (optional) |

### Email Integration
| Provider | Protocol |
|----------|----------|
| Gmail | OAuth 2.0 + Gmail API |
| Outlook | OAuth 2.0 + Microsoft Graph |

---

## Multi-Tenant Architecture

### Data Hierarchy

```
Organization (org)
├── org_members (user ↔ org ↔ role)
├── org_ai_settings
│
├── Club 1
│   ├── club_ai_settings
│   ├── players
│   ├── fixtures
│   ├── content_items
│   ├── sponsors
│   ├── admin_tasks
│   ├── inbox_emails
│   └── email_connections (club-level)
│
└── Club 2
    └── (same structure)
```

### Role System

| Role | Access Level |
|------|--------------|
| `owner` | Full org management, billing, delete |
| `admin` | Full feature access, settings, members |
| `editor` | Create/edit content, players, fixtures |
| `viewer` | Read-only access |

### RLS Implementation

```sql
-- Every table has org_id
-- RLS policy pattern:
CREATE POLICY "org_members_only" ON table_name
  FOR ALL
  USING (is_org_member(org_id))
  WITH CHECK (is_org_member(org_id));

-- Helper function
CREATE FUNCTION is_org_member(p_org_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE;
```

---

## Data Flow

### Authentication Flow

```
User
  │
  ├─► [AuthScreen]
  │      │
  │      ├─► Sign Up ─► supabase.auth.signUp()
  │      │                  │
  │      └─► Sign In ─► supabase.auth.signInWithPassword()
  │                        │
  │                        ▼
  └───────────────────► [Session]
                           │
                           ▼
                      [WorkspaceGate]
                           │
                      Select Org/Club
                           │
                           ▼
                      [Main App]
```

### AI Generation Flow

```
User Click
    │
    ▼
Component (e.g., "Generate Report")
    │
    ▼
geminiService.ts
    │
    ├─► supabase.functions.invoke('ai-generate')
    │
    ▼
Edge Function (ai-generate)
    │
    ├─► Resolve API key (precedence: club → org → platform)
    ├─► Call Gemini API
    ├─► Log to ai_usage_events
    │
    ▼
Return generated content
    │
    ▼
Save to database (content_items)
    │
    ▼
Real-time update
    │
    ▼
Component re-render
```

### Email OAuth Flow

```
User: "Connect Gmail"
    │
    ▼
emailConnectionService.startEmailOAuth()
    │
    ▼
Edge Function (email-oauth-start)
    │
    ├─► Build OAuth URL with state
    │
    ▼
Redirect to Google/Microsoft
    │
    ▼
User grants permission
    │
    ▼
Redirect to callback URL
    │
    ▼
Edge Function (email-oauth-exchange)
    │
    ├─► Exchange code for tokens
    ├─► Encrypt tokens
    ├─► Save to email_connections + email_oauth_tokens
    │
    ▼
Redirect back to app
    │
    ▼
Connection appears in UI
```

### Email Sync Flow

```
User: "Sync Now"
    │
    ▼
emailConnectionService.syncEmailConnection()
    │
    ▼
Edge Function (email-sync)
    │
    ├─► Get connection from DB
    ├─► Decrypt access token
    ├─► Refresh token if expired
    ├─► Fetch messages from provider
    ├─► Normalize message format
    ├─► Upsert to inbox_emails
    ├─► Update last_synced_at
    │
    ▼
Emails appear in InboxView
```

### User Onboarding Flow

```
User logs in + selects workspace
    │
    ▼
OnboardingManager initializes
    │
    ├─► Check/create user_onboarding_state for org
    │
    ▼
If welcome_completed = false:
    │
    ├─► Show Welcome Modal
    │     ├─► "Start Tour" → Run react-joyride tour
    │     └─► "Skip" → Mark welcome_completed = true
    │
    ▼
Tour completes:
    │
    ├─► Mark tour_completed = true
    │
    ▼
User visits Education page:
    │
    ├─► Show modules from educationModules.ts
    ├─► Track completed_modules[] in user_onboarding_state
    └─► Navigate to relevant tabs on "Jump to" actions
```

**Onboarding State Table (`user_onboarding_state`):**
| Column | Type | Description |
|--------|------|-------------|
| org_id | uuid | Organization scope |
| user_id | uuid | User (auth.users.id) |
| welcome_completed | boolean | Welcome modal dismissed |
| tour_completed | boolean | Tour finished/skipped |
| completed_modules | text[] | IDs of completed education modules |

---

## Key Precedence Systems

### AI Key Resolution

```typescript
function resolveAIKey(orgId, clubId?):
  // 1. Check club BYOK
  if clubId and club_ai_settings[clubId].mode === 'byok':
    return decrypt(club_ai_settings[clubId].byok_key)
  
  // 2. Check org BYOK
  if org_ai_settings[orgId].mode === 'byok':
    return decrypt(org_ai_settings[orgId].byok_key)
  
  // 3. Platform managed
  return PLATFORM_GEMINI_API_KEY
```

### Master Inbox Resolution

```typescript
function getMasterInbox(orgId, clubId):
  // 1. Check club master
  clubMaster = email_connections
    .where(org_id: orgId, club_id: clubId, is_master: true)
    .first()
  if clubMaster: return clubMaster
  
  // 2. Check org master
  orgMaster = email_connections
    .where(org_id: orgId, club_id: null, is_master: true)
    .first()
  return orgMaster
```

---

## Database Schema Overview

### Core Tables

```sql
-- Tenancy
orgs                    -- Organizations (workspaces)
org_members             -- User ↔ Org ↔ Role mapping

-- Domain Data
clubs                   -- Football clubs (org-scoped)
players                 -- Player roster (club-scoped)
fixtures                -- Match schedule (club-scoped)
content_items           -- Generated content (club-scoped)
sponsors                -- Sponsor relationships (club-scoped)
admin_tasks             -- Administrative tasks (club-scoped)
inbox_emails            -- Synced emails (club-scoped)

-- AI
ai_conversations        -- Chat sessions
ai_messages             -- Chat messages
org_ai_settings         -- Org-level AI config
club_ai_settings        -- Club-level AI config
ai_usage_events         -- Usage tracking

-- Email
email_connections       -- OAuth connections
email_oauth_tokens      -- Encrypted tokens
```

### Key Relationships

```
orgs 1:N org_members N:1 users (auth.users)
orgs 1:N clubs
clubs 1:N [players, fixtures, content_items, sponsors, admin_tasks, inbox_emails]
orgs 1:1 org_ai_settings
clubs 1:1 club_ai_settings
email_connections 1:1 email_oauth_tokens
```

---

## Edge Functions

| Function | Purpose | Auth |
|----------|---------|------|
| `ai-generate` | AI content generation | User JWT |
| `ai-settings` | Get/set AI configuration | User JWT |
| `email-oauth-start` | Initiate OAuth flow | User JWT |
| `email-oauth-exchange` | Exchange OAuth code | None (callback) |
| `email-sync` | Fetch emails from provider | User JWT |
| `email-send` | Send email via provider | User JWT |

### Edge Function Pattern

```typescript
// supabase/functions/{name}/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );
    
    const { data: { user }, error } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '')
    );
    if (!user) throw new Error('Unauthorized');

    // Process request
    const body = await req.json();
    
    // ... business logic ...

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Security Model

### Authentication
- Supabase Auth (email + password)
- JWT tokens for API authorization
- Session management in client

### Authorization
- RLS policies on all tables
- Role-based access in UI
- org_id filtering on every query

### Data Protection
- OAuth tokens encrypted (AES-256-GCM)
- BYOK API keys encrypted
- HTTPS only

### See Also
- [SECURITY.md](SECURITY.md) for detailed security documentation

---

## Deployment Architecture

### Production

```
┌─────────────────┐     ┌─────────────────┐
│  Vercel/Netlify │     │    Supabase     │
│  (Static Host)  │     │   (Managed)     │
│                 │     │                 │
│  - React App    │◄───►│  - Database     │
│  - CDN          │     │  - Auth         │
│                 │     │  - Functions    │
└─────────────────┘     │  - Real-time    │
                        └─────────────────┘
```

### Environment Variables

**Client (.env.local)**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

**Edge Functions (Supabase Secrets)**
```
GEMINI_API_KEY=
ENCRYPTION_KEY=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
OUTLOOK_CLIENT_ID=
OUTLOOK_CLIENT_SECRET=
```

---

## Development Workflow

### Local Development

```bash
# Start Vite dev server
npm run dev

# Start local Supabase (optional)
supabase start

# Run tests
npm test
```

### Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel/Netlify
# (automatic via Git push)

# Deploy Edge Functions
supabase functions deploy
```

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [CONTEXT.md](CONTEXT.md) | Quick context for LLMs |
| [DATA_MODEL.md](DATA_MODEL.md) | Detailed schema docs |
| [SECURITY.md](SECURITY.md) | Security architecture |
| [RUNBOOK.md](RUNBOOK.md) | Operations guide |
| [AI_OPERATIONS.md](AI_OPERATIONS.md) | AI configuration |
| [INBOX_INTEGRATIONS.md](INBOX_INTEGRATIONS.md) | Email OAuth |

---

*This document provides a comprehensive overview of the system architecture. For specific implementation details, refer to the related documentation files.*
