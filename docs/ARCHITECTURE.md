# D14 / PitchSide - Architecture

**Last Updated:** 2026-01-21  
**Updated By:** Claude (Opus 4.5)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────┤
│  Components          │  Hooks           │  Context           │
│  - Views (pages)     │  - useSupabase   │  - ToastContext    │
│  - Modals            │  - useRealtime   │  - AuthContext     │
│  - Cards/Widgets     │                  │  (future: UserCtx) │
├─────────────────────────────────────────────────────────────┤
│                       SERVICES LAYER                         │
│  fixtureService, playerService, contentService, etc.        │
│  (abstracts Supabase vs localStorage for demo mode)         │
├─────────────────────────────────────────────────────────────┤
│                      DATA LAYER                              │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │    Supabase     │ OR │   localStorage  │                 │
│  │  (production)   │    │   (demo mode)   │                 │
│  └─────────────────┘    └─────────────────┘                 │
├─────────────────────────────────────────────────────────────┤
│                    EXTERNAL SERVICES                         │
│  - Gemini API (AI content generation)                       │
│  - (future: email, push notifications)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App.tsx
├── AuthScreen (if not authenticated)
├── WorkspaceGate (org/club selection)
└── AppAuthed (main app shell)
    ├── Layout
    │   ├── Sidebar (desktop)
    │   ├── Header
    │   ├── BottomNav (mobile)
    │   └── [Active View]
    ├── Dashboard (default view)
    │   ├── MatchdayMode (when active)
    │   ├── TaskList
    │   ├── AlertsWidget
    │   └── StatsCards
    ├── SquadView
    ├── AvailabilityView
    ├── EquipmentView
    ├── ContentHub
    ├── OperationsHub
    ├── SettingsView
    └── ... other views
```

---

## Data Flow

### Read Flow
```
Component → useSupabaseQuery hook → Service → Supabase/localStorage → Data
                                                      ↓
                                              Component re-renders
```

### Write Flow
```
User action → Component handler → Service.create/update → Supabase/localStorage
                                                               ↓
                                                        Refetch triggered
                                                               ↓
                                                      Component re-renders
```

### Real-time (Supabase only)
```
Supabase broadcast → useRealtimeSubscription → State update → Re-render
```

---

## State Management

### Current Approach
- **Local state**: Component-level `useState` for UI state
- **Lifted state**: Parent components hold shared state (e.g., fixtures in App.tsx)
- **Context**: Toast notifications, auth state
- **Server state**: Fetched via `useSupabaseQuery`, refetched on mutations

### Future (with Users & Roles)
```
AuthContext (current user, session)
    └── UserContext (user profile, roles, permissions)
            └── Components (check permissions via usePermission hook)
```

---

## Service Layer Pattern

Each service follows this pattern:

```typescript
// services/exampleService.ts

import { supabase } from './supabaseClient';
import { demoStorage } from './demoStorageService';

const isDemo = () => !supabase || !process.env.VITE_SUPABASE_URL;

export const getItems = async (clubId: string): Promise<Item[]> => {
  if (isDemo()) {
    return demoStorage.get('items') || [];
  }
  
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('club_id', clubId);
    
  if (error) throw error;
  return data;
};

export const createItem = async (clubId: string, item: Partial<Item>): Promise<Item> => {
  if (isDemo()) {
    const newItem = { id: crypto.randomUUID(), ...item };
    const items = demoStorage.get('items') || [];
    demoStorage.set('items', [...items, newItem]);
    return newItem;
  }
  
  const { data, error } = await supabase
    .from('items')
    .insert({ club_id: clubId, ...item })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};
```

---

## Authentication Architecture

### Current
```
┌─────────────────────────────────────────┐
│           Supabase Auth                  │
│  - Email/password                        │
│  - Session stored in localStorage        │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│          WorkspaceGate                   │
│  - Select organization                   │
│  - Select club within org                │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│           AppAuthed                      │
│  - All features available                │
│  - clubId passed to services             │
└─────────────────────────────────────────┘
```

### Future (with RBAC)
```
┌─────────────────────────────────────────┐
│           Supabase Auth                  │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│          WorkspaceGate                   │
│  + Fetch user roles for selected club    │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│         PermissionProvider               │
│  - Exposes usePermission hook            │
│  - Gates routes/components               │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│           AppAuthed                      │
│  - Features based on permissions         │
└─────────────────────────────────────────┘
```

---

## Database Schema (Supabase)

### Existing Tables
```sql
clubs (id, org_id, name, primary_color, secondary_color, logo_url, ...)
fixtures (id, club_id, opponent, kickoff_time, venue, status, ...)
players (id, club_id, name, position, squad_number, ...)
content_items (id, club_id, fixture_id, type, body, status, ...)
equipment_items (id, club_id, name, category, quantity, status, ...)
availability_responses (id, fixture_id, player_id, status, ...)
```

### New Tables (Phase 1-7)
```sql
-- Phase 1: Users & Roles
club_users (id, club_id, user_id, status, created_at)
roles (id, club_id, name, color, is_system)
user_roles (user_id, role_id, is_primary)

-- Phase 2: Permissions
permissions (role_id, module, action)

-- Phase 3: Task Ownership (alter existing)
ALTER TABLE fixture_tasks ADD COLUMN owner_user_id UUID REFERENCES club_users(id);
ALTER TABLE fixture_tasks ADD COLUMN backup_user_id UUID REFERENCES club_users(id);
ALTER TABLE fixture_tasks ADD COLUMN owner_role TEXT;

-- Phase 5: Audit Trail
audit_events (id, club_id, fixture_id, task_id, actor_user_id, event_type, payload, created_at)
```

---

## Styling Architecture

### CSS Structure
```
index.css
├── Tailwind directives (@tailwind base/components/utilities)
├── Global styles (html, body, #root)
├── Safe area support (PWA)
├── Custom animations
│   ├── fade-in
│   ├── scale-in
│   ├── slide-up
│   ├── slide-in-right
│   ├── stagger-in
│   ├── pulse-soft
│   └── glow-pulse
└── Utility classes (.transition-smooth, .stagger-1 to .stagger-5)
```

### Design Tokens (via Tailwind)
```
Colors:
  - Primary: green-500 (#22c55e)
  - Background: [#030303]
  - Cards: bg-white/5, border-white/10
  - Text: slate-400 (secondary), white (primary)
  
Spacing:
  - Cards: p-4 to p-6
  - Gaps: gap-2 to gap-6
  - Rounded: rounded-lg, rounded-xl, rounded-2xl
```

---

## Error Handling

### Pattern
```typescript
try {
  const result = await someService.doThing();
  showSuccess('Thing done!');
} catch (error) {
  const message = handleError(error, 'contextName');
  showError(message);
}
```

### Error Handler (`utils/errorHandler.ts`)
- Logs to console with context
- Returns user-friendly message
- Handles Supabase errors, network errors, generic errors

---

## Performance Considerations

### Current Issues
1. **Bundle size**: ~1.1MB (needs code splitting)
2. **Initial load**: All components loaded upfront

### Planned Optimizations
1. Route-based code splitting with React.lazy
2. Move large dependencies (html2canvas) to dynamic imports
3. Virtual scrolling for long lists (squad, equipment)

---

## Security Considerations

### Current
- Supabase RLS (Row Level Security) for data isolation
- No secrets in frontend code
- API keys in environment variables

### Future (with RBAC)
- Permission checks in services (defense in depth)
- Audit logging for sensitive operations
- Rate limiting on AI endpoints

---

## AI Image Generation Architecture

### Multi-Provider System (Added 2026-01-22)

The image generation system uses intelligent routing to select the best provider for each graphic type:

```
Frontend (geminiService.ts)
         ↓
    /api/ai-generate-image (Vercel Serverless)
         ↓
    Provider Router
         ↓
  ┌──────┼──────┐
  ↓      ↓      ↓
Ideogram Imagen3 Gemini
(text)  (quality) (fallback)
```

### Routing Strategy

| Image Type | Primary Provider | Reason |
|------------|------------------|--------|
| Result Graphics | Ideogram | Best text rendering for scores |
| Matchday Graphics | Ideogram | Accurate team names, dates |
| Player Spotlights | Imagen 3 | Visual quality |
| Announcements | Imagen 3 | Balance of text + visuals |
| Custom Images | Imagen 3 | General purpose |

### Provider Files

```
api/
├── ai-generate-image.ts     # Main endpoint
└── lib/
    └── imageProviders/
        ├── types.ts          # Shared interfaces
        ├── router.ts         # Routing logic + fallback
        ├── imagen.ts         # Google Imagen 3
        ├── ideogram.ts       # Ideogram 2.0
        ├── gemini.ts         # Gemini 2.0 Flash (fallback)
        └── index.ts          # Exports
```

### Environment Variables (Vercel Dashboard)

```
GEMINI_API_KEY      # Required - Imagen 3 + Gemini
IDEOGRAM_API_KEY    # Optional - Enables Ideogram for text-heavy graphics
```

### Fallback Behavior

If a provider fails, the router automatically tries the next provider in the chain:
1. Primary provider fails → Try fallback
2. If Ideogram key not configured → Skip to Imagen 3
3. All providers fail → Return error with last error message
