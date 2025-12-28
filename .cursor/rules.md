# PitchSide AI — Cursor Project Rules

**Last Updated**: January 2025  
**Version**: 3.0.2

## Overview

PitchSide AI is a **Commercial & Media Operating System** for football clubs, focused on Content Automation and Sponsor Revenue. Built with React, TypeScript, Vite, Supabase, and VibeStack patterns.

## Project Context

**Entry Points for Context:**
- `docs/CONTEXT.md` — Main context file (start here)
- `docs/ARCHITECTURE.md` — System architecture
- `docs/UPDATE.md` — Latest changes and changelog
- `docs/USERGUIDE.md` — Complete feature documentation

## Key Architecture Patterns

### Multi-Tenancy
- All data is scoped by `org_id`
- Users belong to orgs via `org_members` table
- Roles: `owner`, `admin`, `editor`, `viewer`
- RLS policies enforce access control
- Workspace selection in `WorkspaceGate.tsx`

### Data Flow
```
User → React Component → Service Layer → Supabase/Edge Function → Database
                                    ↓
                              AI (Gemini) / Background Jobs (Inngest)
```

### VibeStack Patterns
- **Law #1 (Idempotency)**: All Inngest functions are idempotent
- **Law #2 (Eventual Consistency)**: Background jobs via Inngest for content sequences
- **Law #3 (Deterministic State)**: Status unions replace boolean flags
- **Observability**: LangSmith traces all AI calls

### AI Architecture
- AI calls go through Edge Function `ai-generate`
- Key precedence: club BYOK → org BYOK → platform managed
- All AI usage is logged to `ai_usage_events`
- LangSmith observability for debugging

### Authentication & Session
- Login/Signup via `AuthScreen.tsx`
- Logout button in `Layout.tsx` header (top-right)
- Session managed in `App.tsx` with Supabase auth
- Workspace persistence in localStorage

## Coding Conventions

### TypeScript
- Use explicit types, avoid `any`
- Define interfaces in `types.ts`
- Use enums for fixed sets of values

### React
- Functional components with hooks
- Props interfaces named `{Component}Props`
- Keep components focused (single responsibility)

### Services
- One service per entity (e.g., `playerService.ts`)
- Always check `isSupabaseConfigured()` first
- Return empty arrays/null when not configured (for mock mode)
- Use try/catch and log errors

### Styling
- Tailwind CSS classes
- Glassmorphism design pattern
- CSS variables for theme colors
- Custom classes: `glass-panel`, `glass-card`, `neon-*`

## File Organization

```
/
├── App.tsx                      # Main app, routing, state management
├── types.ts                     # All TypeScript interfaces (single source of truth)
├── index.css                    # Global styles + Tailwind
│
├── components/                  # React components
│   ├── Layout.tsx              # Navigation + sidebar (includes logout button)
│   ├── AuthScreen.tsx          # Login/Signup
│   ├── WorkspaceGate.tsx       # Org/Club selection (includes demo data seeding)
│   ├── Dashboard.tsx           # Command Center (includes Generate Matchday Graphics)
│   ├── HypeEngine.tsx          # Content campaigns (formerly FixturesView)
│   ├── SquadView.tsx           # Squad Intel (formerly Squad Bio-Metrics)
│   ├── SponsorNexus.tsx        # Sponsor management + ROI tracking
│   ├── AutoPublisher.tsx       # Bulk content publishing
│   ├── ViralScout.tsx          # Video script ideas
│   ├── ImageGeneratorModal.tsx # AI image generation
│   ├── DemoDataBanner.tsx      # Demo data indicator + clear option
│   └── ...
│
├── services/                    # Service layer
│   ├── supabaseClient.ts       # Client init + isSupabaseConfigured()
│   ├── authService.ts          # signIn, signUp, signOut
│   ├── dataPresenceService.ts  # Check for real/demo data
│   ├── mockDataService.ts      # Seed/clear demo data
│   ├── fanSentimentService.ts  # Fan sentiment analysis from Twitter
│   └── ...
│
├── hooks/                       # Custom React hooks
│   ├── useSupabaseQuery.ts
│   └── useRealtimeSubscription.ts
│
├── utils/                       # Utility functions
│   └── errorHandler.ts
│
├── database/                    # SQL schema
│   └── schema.sql
│
├── supabase/functions/          # Edge Functions
│   ├── ai-generate/
│   ├── ai-settings/
│   └── fan-sentiment/          # Twitter sentiment analysis via Apify
│
├── inngest/                     # Background Jobs
│   ├── client.ts
│   └── functions/
│       └── refreshFanSentiment.ts  # Daily sentiment refresh scheduler
│
├── .cursor/                     # Cursor rules (this file)
├── .gemini                      # Gemini AI context
├── .claude                      # Claude AI context
└── docs/                        # Documentation
```

## Common Tasks

### Adding a New Feature
1. Add types to `types.ts`
2. Create/update service in `services/`
3. Create component in `components/`
4. Wire into `App.tsx`
5. Add RLS policy if needed
6. Update documentation

### Adding an Edge Function
1. Create folder in `supabase/functions/{name}/`
2. Add `index.ts` with Deno serve pattern
3. Handle CORS and authentication
4. Deploy with `supabase functions deploy {name}`

### Updating Database Schema
1. Edit `database/schema.sql`
2. Update `database/README.md`
3. Update relevant services
4. Update `docs/DATA_MODEL.md`

## Testing

- Framework: Vitest
- Run: `npm test`
- Location: `tests/`

## Environment Variables

Required for production:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Edge Function secrets (set in Supabase):
- `GEMINI_API_KEY`
- `ENCRYPTION_KEY`
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`
- `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`

## Important Notes

1. **Mock Mode**: App works without Supabase for demos
2. **Demo Data**: Auto-seeded for new users, can be cleared via DemoDataBanner
3. **RLS**: All database access is org-scoped
4. **BYOK**: Users can bring their own AI keys (club → org → platform precedence)
5. **Edge Functions**: All sensitive operations are server-side
6. **Status Unions**: Use `'idle' | 'generating' | 'success' | 'error'` not boolean flags
7. **Logout**: Button in Layout header, calls authService.signOut()

## Don't

- ❌ Don't expose API keys client-side
- ❌ Don't bypass RLS with service role keys in client
- ❌ Don't create global state outside React context
- ❌ Don't use `any` type without good reason
- ❌ Don't commit `.env` files
- ❌ Don't use boolean flags for state (use status unions)
- ❌ Don't access Supabase directly from components (use services)

## Do

- ✅ Do use service layer for all DB operations
- ✅ Do handle errors gracefully with errorHandler
- ✅ Do update documentation with changes
- ✅ Do use TypeScript strictly
- ✅ Do test critical paths
- ✅ Do use status unions for deterministic state
- ✅ Do check `isSupabaseConfigured()` before DB operations
- ✅ Do include `org_id` in all database queries

## Recent Changes (v3.0.2)

### Fan Sentiment Tracking
- ✅ **Real-time Sentiment Analysis**: Twitter data collection via Apify (no Twitter API needed)
- ✅ **Hybrid Analysis**: Keyword filtering (70%) + Gemini AI deep analysis (30%)
- ✅ **Database**: Added `fan_sentiment_snapshots` table with RLS policies
- ✅ **Edge Function**: `fan-sentiment` for Apify integration and sentiment calculation
- ✅ **Service**: `fanSentimentService.ts` with fetch, refresh, and history methods
- ✅ **UI**: Dashboard displays dynamic sentiment with refresh button
- ✅ **Scheduling**: Inngest job for daily refreshes at 9 AM UTC
- ✅ **Environment**: Requires `APIFY_TOKEN` in Supabase Edge Function secrets

## Recent Changes (v3.0.1)

### Bug Fixes
- ✅ Added logout button to Layout header
- ✅ Fixed Generate Matchday Graphics button functionality
- ✅ Implemented mock data system with auto-seeding

### New Features
- ✅ DemoDataBanner component for demo data management
- ✅ dataPresenceService for checking real/demo data
- ✅ mockDataService for seeding/clearing demo data







