# PitchSide AI — Cursor Project Rules

## Overview

PitchSide AI is a multi-tenant football club management SaaS platform built with React, TypeScript, Vite, and Supabase.

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

### Data Flow
```
User → React Component → Service Layer → Supabase/Edge Function → Database
```

### AI Architecture
- AI calls go through Edge Function `ai-generate`
- Key precedence: club BYOK → org BYOK → platform managed
- All AI usage is logged to `ai_usage_events`

### Email Architecture
- OAuth handled by Edge Functions
- Master inbox (shared) + My inbox (private)
- Precedence: club master → org master

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
├── App.tsx              # Main app, routing, state
├── types.ts             # All TypeScript interfaces
├── index.css            # Global styles + Tailwind
├── components/          # React components
├── services/            # Supabase service layer
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── database/            # SQL schema
├── supabase/functions/  # Edge Functions
└── docs/                # Documentation
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
2. **RLS**: All database access is org-scoped
3. **BYOK**: Users can bring their own AI keys
4. **Master Inbox**: Shared email for team access
5. **Edge Functions**: All sensitive operations are server-side

## Don't

- Don't expose API keys client-side
- Don't bypass RLS with service role keys in client
- Don't create global state outside React context
- Don't use `any` type without good reason
- Don't commit `.env` files

## Do

- Do use service layer for all DB operations
- Do handle errors gracefully
- Do update documentation with changes
- Do use TypeScript strictly
- Do test critical paths







