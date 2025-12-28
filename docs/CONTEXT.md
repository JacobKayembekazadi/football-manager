# Context Guide for LLMs

**Last Updated**: January 2025  
**Version**: 3.0.3 (Database Seeding Fixes)  
**Purpose**: Main entry point for LLM context about PitchSide AI codebase  
**For LLMs**: Read this file first to understand the system architecture and common patterns

---

## Quick Start

1. **System Overview**: PitchAI is a **Commercial & Media Operating System** for football clubs focused on Content Automation and Sponsor Revenue
2. **Architecture**: React Frontend + Supabase Backend + Edge Functions + Google Gemini AI + Inngest + LangSmith
3. **Multi-Tenancy**: Organizations → Clubs → Users with role-based access
4. **Key Principles**: 
   - All data scoped by `org_id`
   - RLS enforces access control
   - AI calls are server-side (Edge Functions) with LangSmith observability
   - Background jobs via Inngest for reliable content sequences
   - Status unions for deterministic state management

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
- **Frontend**: React 19, TypeScript, Vite, Biome (linting/formatting)
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **AI**: Google Gemini 2.5 (via Edge Functions) with LangSmith observability
- **Background Jobs**: Inngest for durable, reliable content sequence generation
- **Styling**: Tailwind CSS, Framer Motion

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
  │     └── Players, Fixtures, Content, Sponsors
  └── Club 2
        └── Players, Fixtures, Content, Sponsors
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
├── contentSequenceService.ts # Content sequence scheduling (Inngest)
├── sponsorService.ts     # Sponsor management
├── sponsorPdfService.ts  # PDF report generation
├── conversationService.ts # AI chat history
├── geminiService.ts      # AI operations (calls Edge Function, LangSmith traced)
├── onboardingService.ts  # User onboarding state per org
└── fanSentimentService.ts # Fan sentiment analysis from Twitter
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

### VibeStack Patterns (Law Compliance)
- **Law #1 (Idempotency)**: All Inngest functions are idempotent
- **Law #2 (Eventual Consistency)**: Content sequences use Inngest for reliable background jobs
- **Law #3 (Deterministic State)**: Status unions replace boolean spaghetti (`idle | generating | success | error`)
- **Observability**: LangSmith traces all AI calls for debugging and cost tracking

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
│   ├── Layout.tsx            # Navigation + sidebar (includes logout button)
│   ├── Dashboard.tsx         # Command Center (includes Generate Matchday Graphics)
│   ├── HypeEngine.tsx        # The Hype Engine (formerly FixturesView) - content campaigns
│   ├── SquadView.tsx         # Squad Intel (formerly Squad Bio-Metrics)
│   ├── SponsorNexus.tsx      # Sponsor management with ROI tracking
│   ├── AutoPublisher.tsx     # One-click copy & bulk download for approved content
│   ├── ViralScout.tsx        # Weekly video script ideas widget
│   ├── ImageGeneratorModal.tsx # AI image generation modal
│   ├── DemoDataBanner.tsx    # Demo data indicator + clear option
│   ├── SettingsView.tsx      # AI settings
│   ├── OnboardingManager.tsx # Welcome modal + tour
│   ├── EducationView.tsx     # Education modules page
│   ├── QuickStartChecklist.tsx # Dashboard progress checklist
│   ├── FixtureFormModal.tsx  # Add/Edit fixtures
│   ├── SponsorFormModal.tsx  # Add/Edit sponsors
│   └── *.tsx                 # Feature components
│
├── content/                   # Static content
│   └── educationModules.ts   # Education module definitions
│
├── services/                  # Service layer
│   ├── supabaseClient.ts
│   ├── authService.ts
│   ├── dataPresenceService.ts # Check for real/demo data
│   ├── mockDataService.ts     # Seed/clear demo data
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
│   └── fan-sentiment/        # Twitter sentiment analysis via Apify
│
├── inngest/                   # Background Jobs (VibeStack Law #2)
│   ├── client.ts             # Inngest client initialization
│   └── functions/
│       ├── generateContentSequence.ts # Content sequence generation
│       └── refreshFanSentiment.ts    # Daily sentiment refresh scheduler
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

## Recent Changes (v3.0.3)

### Database Seeding Fixes ✅
- ✅ **Onboarding Service**: Changed `insert` to `upsert` to prevent 409 duplicate key errors
- ✅ **Conversation Service**: Added graceful error handling for 403 RLS violations
- ✅ **Migration**: New migration `20241228000000_fix_missing_tables.sql` adds missing tables
- ✅ **Documentation**: Updated all docs with troubleshooting guides

### Files Modified
- `services/onboardingService.ts` - Use upsert instead of insert
- `services/conversationService.ts` - Return null on RLS error instead of throwing
- `supabase/migrations/20241228000000_fix_missing_tables.sql` - New migration

---

## Recent Changes (v3.0.2)

### Fan Sentiment Tracking
- ✅ **Real-time Sentiment Analysis**: Twitter data collection via Apify
- ✅ **Hybrid Analysis**: Keyword filtering (70%) + Gemini AI (30%) for accurate sentiment
- ✅ **Database**: Added `fan_sentiment_snapshots` table with RLS
- ✅ **Edge Function**: `fan-sentiment` for Apify integration and sentiment calculation
- ✅ **Service**: `fanSentimentService.ts` with fetch, refresh, and history methods
- ✅ **UI**: Dashboard displays dynamic sentiment with refresh button
- ✅ **Scheduling**: Inngest job for daily refreshes at 9 AM UTC

## Recent Changes (v3.0.1)

### Bug Fixes
- ✅ **Logout Button**: Added to Layout header (top-right) - users can now properly sign out
- ✅ **Generate Matchday Graphics Button**: Verified functionality in Dashboard Command Center
- ✅ **Mock Data System**: Auto-seeding for new users with one-click clear option

### New Features
- ✅ **DemoDataBanner**: Component to inform users about demo data and provide clear option
- ✅ **dataPresenceService**: Service to check for real vs demo data
- ✅ **mockDataService**: Service to seed and clear demo data

## Notes for LLMs

### Do
- ✅ Check `types.ts` for type definitions
- ✅ Use service layer for all DB operations
- ✅ Check `isSupabaseConfigured()` for graceful fallback
- ✅ Include `org_id` in all queries
- ✅ Handle loading and error states
- ✅ Update documentation with changes
- ✅ Use status unions instead of boolean flags

### Don't
- ❌ Access Supabase directly from components
- ❌ Expose API keys client-side
- ❌ Skip RLS policies
- ❌ Hardcode org/club IDs
- ❌ Use `any` without good reason
- ❌ Use boolean flags for state (use status unions)

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
| [AI_OPERATIONS.md](AI_OPERATIONS.md) | AI configuration |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Service reference |
| [DATA_MODEL.md](DATA_MODEL.md) | Database schema |
| [AI_PROMPTS.md](AI_PROMPTS.md) | Prompt engineering |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Setup guide |
| [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) | Dev onboarding |

---

*This is the primary context document. Start here, then dive into specific docs as needed.*
