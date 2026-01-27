# PitchSide AI - Architecture Document

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  React 19 + TypeScript + Vite + Tailwind CSS                    │   │
│  │  ├── App.tsx (Main router + state management)                    │   │
│  │  ├── /components (60+ UI components)                             │   │
│  │  ├── /services (API abstraction layer)                           │   │
│  │  └── /hooks (usePermission, useSupabaseQuery, etc.)              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
└────────────────────────────────────│─────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
    ┌───────────────────────────┐     ┌──────────────────────────────┐
    │     VERCEL FUNCTIONS      │     │         SUPABASE             │
    │  ┌─────────────────────┐  │     │  ┌────────────────────────┐  │
    │  │ /api/ai-generate    │  │     │  │  PostgreSQL + RLS      │  │
    │  │ /api/ai-generate-   │  │     │  │  (Multi-tenant DB)     │  │
    │  │     image           │  │     │  ├────────────────────────┤  │
    │  └─────────────────────┘  │     │  │  Auth (JWT)            │  │
    └───────────────────────────┘     │  ├────────────────────────┤  │
                    │                 │  │  Edge Functions        │  │
                    ▼                 │  │  - ai-generate         │  │
    ┌───────────────────────────┐     │  │  - email-oauth-*       │  │
    │     AI PROVIDERS          │     │  │  - ai-settings         │  │
    │  ┌─────────────────────┐  │     │  ├────────────────────────┤  │
    │  │ Google Gemini 2.5   │──┼─────┼──│  Realtime Subscriptions│  │
    │  │ Ideogram API        │  │     │  │  (Live data updates)   │  │
    │  │ Google Imagen 3     │  │     │  └────────────────────────┘  │
    │  └─────────────────────┘  │     └──────────────────────────────┘
    └───────────────────────────┘                   │
                                                    │
                            ┌───────────────────────┴───────────────────┐
                            │              INNGEST                       │
                            │  (Background Jobs / Scheduled Tasks)       │
                            │  - Content sequence automation             │
                            │  - Sentiment refresh (daily 9 AM UTC)      │
                            │  - Email sync                              │
                            └───────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.1 | UI framework |
| TypeScript | 5.8 | Type safety |
| Vite | 6.x | Build tool & dev server |
| Tailwind CSS | 3.4 | Styling (glassmorphism design) |
| Framer Motion | - | Animations |
| Lucide React | - | Icons |
| jsPDF | - | PDF generation |
| JSZip | - | ZIP downloads |
| react-joyride | - | Guided tours |

### Backend
| Technology | Purpose |
|------------|---------|
| Supabase | PostgreSQL + Auth + Edge Functions |
| Vercel | Serverless functions + Hosting |
| Inngest | Background job orchestration |
| LangSmith | AI tracing & observability |

### AI & External Services
| Service | Purpose |
|---------|---------|
| Google Gemini 2.5 Pro | Content generation (server-side) |
| Ideogram API | Text-heavy image generation |
| Google Imagen 3 | High-quality image generation |
| Apify | Twitter sentiment data collection |
| Sentry | Error tracking |

---

## Data Architecture

### Multi-Tenant Model

```
User (Supabase Auth)
    │
    ├── OrgMember ──── Org (Workspace)
    │                    │
    │                    ├── Club 1
    │                    │    ├── Players
    │                    │    ├── Fixtures
    │                    │    ├── Content
    │                    │    ├── Sponsors
    │                    │    └── Tasks
    │                    │
    │                    └── Club 2
    │                         └── ...
    │
    └── ClubUser (with Roles)
```

### Core Entities

```typescript
// Organization (Multi-tenant boundary)
interface Org {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
}

// Club (Primary entity)
interface Club {
  id: string;
  org_id: string;
  name: string;
  badge_url?: string;
  primary_color: string;
  secondary_color: string;
}

// Player
interface Player {
  id: string;
  club_id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  number: number;
  stats: PlayerStats;
  form: number; // 0-10
  is_captain: boolean;
}

// Fixture
interface Fixture {
  id: string;
  club_id: string;
  opponent: string;
  venue: 'HOME' | 'AWAY';
  kickoff_time: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
  result?: { home_score: number; away_score: number };
  match_stats?: MatchStats;
}

// Content
interface ContentItem {
  id: string;
  club_id: string;
  fixture_id?: string;
  type: ContentType;
  status: 'DRAFT' | 'APPROVED' | 'PUBLISHED';
  body: string;
  image_url?: string;
}

// Sponsor
interface Sponsor {
  id: string;
  club_id: string;
  name: string;
  tier: 'Platinum' | 'Gold' | 'Silver';
  roi: SponsorROI;
  contract_start: string;
  contract_end: string;
}
```

### Database Schema

```sql
-- RLS-Protected Tables
orgs                    -- Workspaces
org_members             -- User-Org relationships
clubs                   -- Football clubs
club_users              -- Club staff members
club_roles              -- Custom role definitions
user_roles              -- Role assignments
players                 -- Squad roster
fixtures                -- Match schedule
content_items           -- Generated content
sponsors                -- Partner contracts
fixture_tasks           -- Matchday checklists
template_packs          -- Task templates
player_availability     -- Fixture availability
player_kit_assignments  -- Kit management
club_equipment          -- Shared equipment
ai_conversations        -- Chat history
fan_sentiment_snapshots -- Daily sentiment
audit_events            -- Event logging
```

---

## Security Architecture

### Authentication Flow

```
1. User enters email/password
          │
          ▼
2. Supabase Auth validates credentials
          │
          ▼
3. JWT token issued (stored in localStorage)
          │
          ▼
4. WorkspaceGate shows org selection
          │
          ▼
5. Club selection within org
          │
          ▼
6. All API calls include JWT in header
          │
          ▼
7. RLS policies enforce org_id scoping
```

### Row Level Security (RLS)

```sql
-- Example: Players table RLS
CREATE POLICY "Players visible to org members"
ON players FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clubs c
    JOIN org_members om ON c.org_id = om.org_id
    WHERE c.id = players.club_id
    AND om.user_id = auth.uid()
  )
);
```

### Authorization Layers

| Layer | Enforcement |
|-------|-------------|
| Database | RLS policies (org_id scoping) |
| Service | Permission checks before mutations |
| UI | `usePermission()` hook for feature gating |

### Secrets Management

| Secret | Location |
|--------|----------|
| VITE_SUPABASE_URL | Vercel env (public) |
| VITE_SUPABASE_ANON_KEY | Vercel env (public) |
| GEMINI_API_KEY | Supabase secrets |
| IDEOGRAM_API_KEY | Supabase secrets |
| SENTRY_DSN | Vercel env |

---

## API Architecture

### Service Layer Pattern

```typescript
// All services follow this pattern:
export const getPlayers = async (clubId: string): Promise<Player[]> => {
  // 1. Check for demo mode
  if (!supabase || !isSupabaseConfigured()) {
    return getDemoPlayers();
  }

  // 2. Try Supabase
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('club_id', clubId);

    if (error) {
      console.error('Error, falling back to demo:', error);
      return getDemoPlayers();
    }

    return data;
  } catch (error) {
    return getDemoPlayers();
  }
};
```

### AI Generation Flow

```
Frontend Request
       │
       ▼
┌──────────────────┐
│ /api/ai-generate │  (Vercel Function)
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ Check for BYOK (org's key)   │
│ Fall back to platform key    │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Google Gemini 2.5 Pro API    │
│ - System prompt (context)    │
│ - User prompt (request)      │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Parse response               │
│ Extract JSON if needed       │
│ Return to frontend           │
└──────────────────────────────┘
```

### Image Generation Flow

```
Frontend Request (style, prompt)
       │
       ▼
┌──────────────────────────┐
│ Provider Router Logic    │
│                          │
│ if (hasText) → Ideogram  │
│ else → Imagen 3          │
│ fallback → Gemini        │
└────────────┬─────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
┌──────────┐  ┌──────────┐
│ Ideogram │  │ Imagen 3 │
│ (scores) │  │ (quality)│
└────┬─────┘  └────┬─────┘
     │             │
     └──────┬──────┘
            ▼
┌──────────────────────────┐
│ Return base64 or URL     │
└──────────────────────────┘
```

---

## State Management

### Frontend State

```
┌─────────────────────────────────────────────┐
│                   App.tsx                    │
│  ┌─────────────────────────────────────┐    │
│  │  Global State (useState)            │    │
│  │  - club: Club                       │    │
│  │  - players: Player[]                │    │
│  │  - fixtures: Fixture[]              │    │
│  │  - contentItems: ContentItem[]      │    │
│  │  - sponsors: Sponsor[]              │    │
│  │  - activeTab: Tab                   │    │
│  │  - selectedFixture: Fixture | null  │    │
│  └─────────────────────────────────────┘    │
│                     │                        │
│          Props passed to children            │
│                     │                        │
│  ┌─────────────────────────────────────┐    │
│  │  Child Components                   │    │
│  │  - SquadView (players)              │    │
│  │  - FixtureList (fixtures)           │    │
│  │  - ContentHub (contentItems)        │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Real-Time Updates

```typescript
// Supabase Realtime Subscription
useRealtimeSubscription({
  table: 'fixtures',
  filter: `club_id=eq.${clubId}`,
  onUpdate: (payload) => {
    setFixtures(prev =>
      prev.map(f => f.id === payload.new.id ? payload.new : f)
    );
  },
});
```

---

## Component Architecture

### Layout Hierarchy

```
<ErrorBoundary>
  <ToastProvider>
    <Suspense fallback={<LoadingSpinner />}>
      <AuthScreen />           // Unauthenticated
      OR
      <WorkspaceGate>          // Org/Club selection
        <AppAuthed>            // Main application
          <Layout>
            <Sidebar />        // Desktop nav
            <Header />
            <BottomNav />      // Mobile nav

            {/* Active View */}
            <Dashboard />
            <SquadView />
            <ContentHub />
            <OperationsHub />
            <SponsorNexus />
            <SettingsView />
          </Layout>

          {/* Modals */}
          <FixtureFormModal />
          <PlayerFormModal />
          <ImageGeneratorModal />
        </AppAuthed>
      </WorkspaceGate>
    </Suspense>
  </ToastProvider>
</ErrorBoundary>
```

### Lazy Loading

```typescript
// Code splitting for better initial load
const SquadView = lazy(() => import('./components/SquadView'));
const ContentHub = lazy(() => import('./components/ContentHub'));
const OperationsHub = lazy(() => import('./components/OperationsHub'));
const SponsorNexus = lazy(() => import('./components/SponsorNexus'));
```

---

## Error Handling

### Error Boundary

```typescript
// Global error boundary with Sentry integration
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
```

### Service Error Pattern

```typescript
try {
  const data = await supabaseOperation();
  return data;
} catch (error) {
  console.error('Context:', error);
  handleError(error, 'User-friendly message');
  return fallbackData;  // Demo mode fallback
}
```

---

## Performance Optimizations

| Optimization | Implementation |
|--------------|----------------|
| Code Splitting | React.lazy() for route components |
| Skeleton Loading | LoadingSpinner component |
| Query Caching | useSupabaseQuery with stale-while-revalidate |
| Image Optimization | Lazy loading, responsive sizes |
| Bundle Analysis | Vite build analyzer |

---

## Deployment Architecture

```
GitHub Repository
       │
       ├── Push to main
       │        │
       │        ▼
       │   ┌──────────────┐
       │   │    Vercel    │
       │   │  - Build     │
       │   │  - Deploy    │
       │   │  - Functions │
       │   └──────────────┘
       │
       └── Database Migrations
                │
                ▼
        ┌──────────────┐
        │   Supabase   │
        │  - Schema    │
        │  - RLS       │
        │  - Functions │
        └──────────────┘
```

---

## Monitoring & Observability

| Tool | Purpose |
|------|---------|
| Sentry | Error tracking, performance monitoring |
| LangSmith | AI call tracing, token usage |
| Supabase Dashboard | Database metrics, auth events |
| Vercel Analytics | Frontend performance, traffic |

---

*Document Version: 1.0 | Last Updated: January 2025*
