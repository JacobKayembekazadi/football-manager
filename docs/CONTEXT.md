# D14 / PitchSide - Project Context

**Last Updated:** 2026-01-21
**Updated By:** Claude (Opus 4.5)
**Current Phase:** Independence & Leverage - Phase 2 COMPLETE, Phase 3 next

---

## What This Project Is

D14 (branded as PitchSide) is a **football operations command centre** for grassroots and lower-league clubs. It handles:

- Matchday workflows and checklists
- Task ownership and accountability
- Equipment tracking
- Content generation (AI-assisted)
- Squad management and availability

**Key differentiator:** "Pitchero runs the club. D14 runs the football department."

---

## Current State Summary

### Completed Features
- ✅ Dashboard with matchday mode
- ✅ Fixtures management (CRUD)
- ✅ Squad/player management
- ✅ Availability tracking
- ✅ Equipment inventory + laundry tracking
- ✅ Content generation (AI via Gemini)
- ✅ Templates system (matchday packs)
- ✅ Mobile responsive design
- ✅ PWA support (manifest, icons)
- ✅ Toast notifications
- ✅ Quick Action FAB (mobile)
- ✅ Basic auth (Supabase or demo mode)

### In Progress
- 🔄 **Independence & Leverage** feature set:
  - Phase 1: Users & Roles (STARTING)
  - Phase 2: RBAC / Permissions
  - Phase 3: Task Ownership + Backup
  - Phase 4: Volunteer-proof Templates
  - Phase 5: Audit Trail
  - Phase 6: Quick Handover
  - Phase 7: Exception Alerts

### Not Started
- ❌ Multi-club support
- ❌ Payment/membership features (intentionally avoided)
- ❌ Public website generation

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS (dark theme, glass-card pattern) |
| State | React hooks + context |
| Backend | Supabase (or localStorage demo mode) |
| AI | Google Gemini API |
| Build | Vite |

---

## Key Files & Structure

```
/home/user/football-manager/
├── App.tsx                 # Main app, routing, dashboard
├── types.ts                # All TypeScript types + mock data
├── index.css               # Custom CSS, animations
├── index.html              # PWA meta tags
├── components/
│   ├── Layout.tsx          # Shell, sidebar, header
│   ├── BottomNav.tsx       # Mobile navigation
│   ├── Toast.tsx           # Notification system
│   ├── EmptyState.tsx      # Reusable empty states
│   ├── QuickActionFAB.tsx  # Mobile quick actions
│   ├── FixtureTasks.tsx    # Task checklist component
│   ├── EquipmentView.tsx   # Kit inventory
│   ├── AvailabilityView.tsx
│   ├── SquadView.tsx
│   ├── SettingsView.tsx
│   └── ... (30+ components)
├── services/
│   ├── fixtureTaskService.ts  # Templates + task generation
│   ├── equipmentService.ts
│   ├── geminiService.ts       # AI content generation
│   └── ... (10+ services)
├── docs/                   # LLM context (YOU ARE HERE)
│   ├── LLM_INSTRUCTIONS.md
│   ├── CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── CHANGELOG.md
│   └── FEATURE_SPECS.md
└── public/
    ├── manifest.json       # PWA manifest
    └── icons/
```

---

## Data Models (Current)

### Core Entities
```typescript
Club: { id, name, primary_color, secondary_color, logo_url, ... }
Fixture: { id, club_id, opponent, kickoff_time, venue, status, ... }
Player: { id, club_id, name, position, squad_number, ... }
ContentItem: { id, club_id, fixture_id, type, body, status, ... }
EquipmentItem: { id, club_id, name, category, quantity, status, ... }
```

### Task System (Current)
```typescript
TemplatePack: { id, club_id, name, enabled, tasks: TemplateTask[] }
TemplateTask: { label, offset_hours, category }
FixtureTask: { id, fixture_id, label, status, due_at, category }
```

### Task System (After Phase 3)
```typescript
// Extended fields
FixtureTask: { 
  ...existing,
  owner_user_id,      // NEW
  backup_user_id,     // NEW
  owner_role          // NEW (fallback)
}
```

---

## Design Patterns

### UI Patterns
- **Glass cards**: `glass-card` class for panels
- **Green accent**: Primary action color (#22c55e)
- **Dark theme**: Background #030303, cards with white/10 borders
- **Animations**: fade-in, scale-in, slide-up (see index.css)

### Code Patterns
- Services handle data ops, components handle UI
- Demo mode uses localStorage, prod uses Supabase
- Toast context for notifications (no alert() calls)
- Empty states via `EmptyState` component

---

## Upcoming Work (Independence & Leverage)

### Phase 1: Users & Roles
Add multi-user support with roles (Admin, Coach, Ops, Media, Kit, Finance).

**New files needed:**
- `services/userService.ts`
- `services/roleService.ts`
- `components/TeamSettings.tsx` (user/role management UI)

**Type additions:**
```typescript
User: { id, club_id, email, name, avatar_url, status }
Role: { id, club_id, name, color, is_system }
UserRole: { user_id, role_id, is_primary }
```

### Phase 2-7
See `docs/FEATURE_SPECS.md` for full specifications.

---

## Known Issues / Tech Debt

1. Large bundle size (~1.1MB) - needs code splitting
2. Some dynamic imports trigger Vite warnings
3. Demo mode mock data is in types.ts (should be separate)

---

## Contact / Ownership

- **Product Owner:** Jacob Kayembekazadi
- **Repository:** JacobKayembekazadi/football-manager
- **Current Branch:** claude/analyze-codebase-checklist-DsfI5
