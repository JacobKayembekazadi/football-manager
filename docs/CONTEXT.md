# Context Guide for LLMs

**Last Updated**: 2024-12-17  
**Version**: 2.0.0  
**Purpose**: Main entry point for LLM context about PitchSide AI codebase  
**For LLMs**: Read this file first to understand the system architecture and common patterns

---

## Quick Start

1. **System Overview**: PitchSide AI is a **multi-tenant SaaS platform** for football club media management
2. **Architecture**: React Frontend + Supabase Backend + Edge Functions + Google Gemini AI
3. **Multi-Tenancy**: Organizations → Clubs → Users with role-based access
4. **Key Principles**: 
   - All data scoped by `org_id`
   - RLS enforces access control
   - AI calls are server-side (Edge Functions)
   - Email OAuth handled server-side

## Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | Main component, routing, state |
| `types.ts` | All TypeScript interfaces |
| `services/` | Data operations + AI |
| `components/` | UI components |
| `supabase/functions/` | Edge Functions |
| `database/schema.sql` | Full database schema |

---

## System Architecture

### Technology Stack
- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **AI**: Google Gemini 2.5 (via Edge Functions)
- **Styling**: Tailwind CSS

### Data Flow
```
User → React Component → Service Layer → Supabase/Edge Function → Database
                                    ↓
                              AI (Gemini) / Email (Gmail/Outlook)
```

### Multi-Tenant Hierarchy
```
Organization (org)
  └── Club 1
  │     └── Players, Fixtures, Content, Sponsors, Tasks, Emails
  └── Club 2
        └── Players, Fixtures, Content, Sponsors, Tasks, Emails
```

### Role System
| Role | Permissions |
|------|-------------|
| `owner` | Full access, manage org, delete org |
| `admin` | Full feature access, settings |
| `editor` | Create/edit content, players, fixtures |
| `viewer` | Read-only access |

---

## Service Layer Pattern

All database operations go through `services/`:

```
services/
├── supabaseClient.ts     # Client init + isSupabaseConfigured()
├── authService.ts        # Signup, signin, signout
├── orgService.ts         # Org + membership management
├── clubService.ts        # Club CRUD
├── playerService.ts      # Player roster
├── fixtureService.ts     # Match fixtures
├── contentService.ts     # Generated content
├── sponsorService.ts     # Sponsor management
├── taskService.ts        # Admin tasks
├── emailService.ts       # Email records
├── emailConnectionService.ts # Email OAuth connections
├── conversationService.ts # AI chat history
├── geminiService.ts      # AI operations (calls Edge Function)
└── onboardingService.ts  # User onboarding state per org
```

### Service Pattern
```typescript
// Check Supabase first
export const getItems = async (orgId: string, clubId: string): Promise<Item[]> => {
  if (!supabase || !isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('org_id', orgId)
    .eq('club_id', clubId);
  
  if (error) throw error;
  return data || [];
};
```

---

## Key Patterns

### Authentication
```typescript
// AuthScreen.tsx handles login/signup
// App.tsx checks session state
if (!session) {
  return <AuthScreen onAuth={handleAuth} />;
}
```

### Workspace Selection
```typescript
// WorkspaceGate.tsx for org/club selection
if (!selectedOrg || !selectedClub) {
  return <WorkspaceGate onSelect={handleSelect} />;
}
```

### Data Fetching (with fallback)
```typescript
const { data, loading, error, refetch } = useSupabaseQuery(
  () => getPlayers(clubId),
  [clubId]
);

// Use mock data if Supabase not configured
const players = data ?? MOCK_PLAYERS;
```

### Real-time Updates
```typescript
useRealtimeSubscription(
  (callback) => subscribeToPlayers(clubId, callback),
  (players) => setPlayers(players),
  [clubId]
);
```

### AI Generation (via Edge Function)
```typescript
// geminiService.ts calls Edge Function
const response = await supabase.functions.invoke('ai-generate', {
  body: { orgId, clubId, action: 'playerAnalysis', payload: { player } }
});
```

---

## Multi-Tenancy Concepts

### Org ID Propagation
- All domain tables have `org_id`
- Triggers auto-populate `org_id` from `club_id`
- RLS policies filter by `is_org_member(org_id)`

### AI Key Precedence
```
Club BYOK → Org BYOK → Platform Managed
```

### Email Inbox Precedence
```
Master Inbox: Club Master → Org Master
My Inbox: User's private connections
```

---

## File Organization

```
/
├── App.tsx                    # Main app, routing, state
├── types.ts                   # TypeScript definitions
├── index.css                  # Global styles + Tailwind
│
├── components/                # React components
│   ├── AuthScreen.tsx        # Login/Signup
│   ├── WorkspaceGate.tsx     # Org/Club selection
│   ├── Layout.tsx            # Navigation + sidebar
│   ├── InboxView.tsx         # Email inbox (Master/My tabs)
│   ├── SettingsView.tsx      # AI + Email settings
│   ├── OnboardingManager.tsx # Welcome modal + tour
│   ├── EducationView.tsx     # Education modules page
│   ├── QuickStartChecklist.tsx # Dashboard progress checklist
│   ├── FixtureFormModal.tsx  # Add/Edit fixtures
│   ├── SponsorFormModal.tsx  # Add/Edit sponsors
│   ├── TaskFormModal.tsx     # Add/Edit admin tasks
│   └── *.tsx                 # Feature components
│
├── content/                   # Static content
│   └── educationModules.ts   # Education module definitions
│
├── services/                  # Service layer
│   ├── supabaseClient.ts
│   ├── authService.ts
│   ├── orgService.ts
│   ├── *Service.ts
│   └── geminiService.ts
│
├── hooks/                     # Custom hooks
│   ├── useSupabaseQuery.ts
│   └── useRealtimeSubscription.ts
│
├── utils/                     # Utilities
│   └── errorHandler.ts
│
├── database/                  # Schema
│   ├── schema.sql            # Full SQL schema
│   └── README.md
│
├── supabase/functions/        # Edge Functions
│   ├── ai-generate/
│   ├── ai-settings/
│   ├── email-oauth-start/
│   ├── email-oauth-exchange/
│   ├── email-sync/
│   └── email-send/
│
├── .cursor/                   # Cursor rules
│   └── rules.md
│
└── docs/                      # Documentation
    ├── CONTEXT.md            # This file (start here)
    ├── UPDATE.md             # Changelog + updates
    ├── ARCHITECTURE.md       # System architecture
    ├── USECASES.md           # All use cases
    ├── USERGUIDE.md          # End-user guide
    ├── SECURITY.md           # Security docs
    ├── RUNBOOK.md            # Operations guide
    ├── INBOX_INTEGRATIONS.md # Email OAuth
    ├── AI_OPERATIONS.md      # AI configuration
    ├── API_DOCUMENTATION.md  # API reference
    ├── DATA_MODEL.md         # Database docs
    ├── AI_PROMPTS.md         # Prompt engineering
    ├── DEPLOYMENT.md         # Deployment guide
    └── DEVELOPMENT_GUIDE.md  # Dev onboarding
```

---

## Making Changes

### Adding a Feature
1. **Types**: Add interfaces to `types.ts`
2. **Schema**: Update `database/schema.sql` if DB changes
3. **Service**: Create/update service in `services/`
4. **Component**: Build UI in `components/`
5. **Wire**: Connect in `App.tsx`
6. **Docs**: Update relevant documentation

### Adding an Edge Function
1. Create `supabase/functions/{name}/index.ts`
2. Use Deno serve pattern
3. Handle CORS and auth
4. Deploy with `supabase functions deploy {name}`

### Modifying RLS
1. Update policies in `database/schema.sql`
2. Test with different user roles
3. Update `docs/SECURITY.md`

---

## Notes for LLMs

### Do
- ✅ Check `types.ts` for type definitions
- ✅ Use service layer for all DB operations
- ✅ Check `isSupabaseConfigured()` for graceful fallback
- ✅ Include `org_id` in all queries
- ✅ Handle loading and error states
- ✅ Update documentation with changes

### Don't
- ❌ Access Supabase directly from components
- ❌ Expose API keys client-side
- ❌ Skip RLS policies
- ❌ Hardcode org/club IDs
- ❌ Use `any` without good reason

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [UPDATE.md](UPDATE.md) | Latest changes, changelog |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture |
| [USECASES.md](USECASES.md) | All use cases |
| [USERGUIDE.md](USERGUIDE.md) | End-user guide |
| [SECURITY.md](SECURITY.md) | Security documentation |
| [RUNBOOK.md](RUNBOOK.md) | Operations procedures |
| [INBOX_INTEGRATIONS.md](INBOX_INTEGRATIONS.md) | Email OAuth |
| [AI_OPERATIONS.md](AI_OPERATIONS.md) | AI configuration |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Service reference |
| [DATA_MODEL.md](DATA_MODEL.md) | Database schema |
| [AI_PROMPTS.md](AI_PROMPTS.md) | Prompt engineering |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Setup guide |
| [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) | Dev onboarding |

---

*This is the primary context document. Start here, then dive into specific docs as needed.*
