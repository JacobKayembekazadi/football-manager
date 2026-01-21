# D14 / PitchSide - Changelog

All notable changes to this project are documented here. LLMs working on this project MUST update this file after every session.

---

## [Unreleased]

### In Progress
- Independence & Leverage feature set (Phase 5-7 pending)

---

## 2026-01-21

### Added - Independence & Leverage Phase 4: Volunteer-proof Templates (Session: Claude Opus 4.5)
- **Auto-Apply Setting**: Templates can be set to auto-apply based on venue (home/away/always/never)
- **Default Owner Roles**: Each template pack and individual task can specify default owner roles
- **Auto-Assignment**: When tasks are generated, owners are automatically assigned based on their primary role
- **Due Date Calculation**: Tasks with offset_hours are automatically assigned due dates relative to kickoff
- **Enhanced DEFAULT_TEMPLATE_PACKS**: All 6 default packs now have role-based auto-assignment

### Features
- **Automatic Task Assignment**: When generating tasks from templates:
  - System finds first active user with matching primary role
  - Assigns them as task owner automatically
  - Calculates due_at from kickoff_time and offset_hours
- **Role-Based Auto-Apply**: Packs auto-apply based on venue setting
- **Task-Level Override**: Individual tasks can override pack-level default owner role

### Type Changes
- Added `TemplateAutoApply = 'never' | 'home' | 'away' | 'always'`
- Extended `TemplatePack` with `auto_apply` and `default_owner_role`
- Extended `TemplateTask` already had `default_owner_role`, `default_backup_role`, `offset_hours`

### Files Modified
- `types.ts` - Added TemplateAutoApply, extended TemplatePack, updated DEFAULT_TEMPLATE_PACKS
- `services/fixtureTaskService.ts` - Added findUserByRole, calculateDueDate, updated generateTasksFromTemplates
- `services/demoStorageService.ts` - Updated generateDemoTasksFromTemplates for demo mode
- `components/FixtureTasks.tsx` - Pass kickoff_time to generateTasksFromTemplates
- `docs/CONTEXT.md` - Updated to reflect Phase 4 completion

---

### Added - Independence & Leverage Phase 3: Task Ownership (Session: Claude Opus 4.5)
- **TaskOwnerSelector Component**: Dropdown for assigning task owners with backup support
- **MyTasks Component**: View all assigned tasks across upcoming fixtures
- **FixtureTasks Update**: Integrated ownership display, claim button, owner avatars
- **Task Ownership Fields**: Extended FixtureTask with owner_user_id, backup_user_id, owner_role, due_at

### Features
- **Claim Tasks**: Users can claim unassigned tasks with one click
- **Assign Owners**: Dropdown to select task owner with avatar display
- **Backup Support**: Optional backup user for each task
- **Visual Indicators**:
  - Blue border for "my tasks"
  - Owner avatars with status
  - Backup indicator badge
  - Overdue task warnings

### Files Added
- `components/TaskOwnerSelector.tsx`
- `components/MyTasks.tsx`

### Files Modified
- `components/FixtureTasks.tsx` - Added ownership display and claim functionality
- `services/fixtureTaskService.ts` - Extended mapper with ownership fields, updated updateFixtureTask
- `types.ts` - Already had ownership fields from earlier in session
- `docs/CONTEXT.md` - Updated to reflect Phase 3 completion

---

### Added - Independence & Leverage Phase 2: RBAC (Session: Claude Opus 4.5)
- **Permission Service**: Created `services/permissionService.ts` with default permission matrix
- **usePermission Hook**: Created `hooks/usePermission.ts` for React permission checks
- **PermissionGate Component**: Created `components/PermissionGate.tsx` for conditional rendering
- **PermissionContext**: Created `contexts/PermissionContext.tsx` for app-wide permission state

### Default Permission Matrix
| Role | Fixtures | Content | Equipment | Squad | Finance | Settings | Templates |
|------|----------|---------|-----------|-------|---------|----------|-----------|
| Admin | Full | Full | Full | Full | Full | Full | Full |
| Coach | View/Edit | View | View | Full | - | - | View |
| Ops | View | View | Full | View | - | - | View/Edit |
| Media | View | Full | View | View | - | - | View/Edit |
| Kit | View | View | Full | View | - | - | View/Edit |
| Finance | View | View | View | View | Full | - | - |

### Files Added
- `services/permissionService.ts`
- `hooks/usePermission.ts`
- `components/PermissionGate.tsx`
- `contexts/PermissionContext.tsx`

---

### Added - Independence & Leverage Phase 1 (Session: Claude Opus 4.5)
- **Users & Roles Types**: Added `ClubUser`, `ClubRole`, `UserRole`, `Permission` types to `types.ts`
- **Mock Data**: Added `INITIAL_ROLES` (6 default roles) and `INITIAL_CLUB_USERS` (5 mock users)
- **User Service**: Created `services/userService.ts` for CRUD operations
- **UI Components**: Created `UserAvatar.tsx`, `RoleBadge.tsx`, `TeamSettings.tsx`
- **Settings Integration**: Added Team Members section to SettingsView

### Files Added
- `services/userService.ts`
- `components/UserAvatar.tsx`
- `components/RoleBadge.tsx`
- `components/TeamSettings.tsx`

### Files Modified
- `types.ts` - Added ClubUser, ClubRole, UserRole, Permission interfaces + mock data
- `components/SettingsView.tsx` - Integrated TeamSettings component

---

### Added - Polish Features (Session: Claude Opus 4.5)
- **PWA Support**: Added `manifest.json`, PWA meta tags, favicon
- **Quick Action FAB**: Mobile floating action button for quick navigation
- **Toast Notifications**: Replaced all `alert()` calls with styled toasts
- **Empty States**: Reusable `EmptyState` component with presets
- **Micro-animations**: scale-in, glow-pulse, stagger effects in `index.css`
- **LLM Context Docs**: Created `docs/` folder with context documentation

### Changed
- Applied `animate-scale-in` to modals (MatchReportModal, FixtureFormModal)
- Applied `animate-glow` to Match Day Mode button
- Updated InboxView and SquadView to use EmptyState component

### Files Modified
- `App.tsx` - Toast integration, FAB, matchday button animation
- `index.css` - New animation keyframes
- `index.html` - PWA meta tags
- `components/Toast.tsx` - Mobile positioning
- `components/EmptyState.tsx` - New component
- `components/QuickActionFAB.tsx` - New component
- `components/InboxView.tsx` - EmptyState integration
- `components/SquadView.tsx` - EmptyState integration
- `components/MatchReportModal.tsx` - scale-in animation
- `components/FixtureFormModal.tsx` - scale-in animation
- `public/manifest.json` - New file
- `public/icons/favicon.svg` - New file

---

## 2026-01-21 (Earlier)

### Added - Mobile Responsiveness (Session: Claude Opus 4.5)
- Phase 1: Bottom nav with "More" menu, table scrolling, grid fixes
- Phase 2: Mobile-friendly modals, touch targets, responsive buttons
- Phase 3: Removed hamburger menu, simplified mobile header, logout in settings

### Changed
- Made sidebar desktop-only (`hidden md:flex`)
- Updated fixture mock data to have match TODAY for testing

### Files Modified
- `components/Layout.tsx` - Removed hamburger, simplified header
- `components/BottomNav.tsx` - Complete rewrite with More menu
- `components/SettingsView.tsx` - Added mobile logout button
- `types.ts` - Added `hoursFromNow` helper, updated mock fixture

---

## 2026-01-20 (Approximate)

### Added - Matchday Mode
- Dashboard matchday mode with big action buttons
- Team sheet export functionality
- Task checklists connected to templates

### Added - Templates Fix
- Fixed missing `getFixtureTasksForFixture` function
- Templates now auto-apply when visiting Dashboard

---

## Pre-2026-01-20

### Initial Features
- Core dashboard and navigation
- Fixtures CRUD
- Squad management
- Availability tracking
- Equipment inventory
- Content generation (AI)
- Basic templates system
- Supabase integration
- Demo mode with mock data

---

## Format Guide

When updating this changelog:

```markdown
## YYYY-MM-DD

### Added - Feature Name (Session: LLM Model)
- Bullet points of what was added

### Changed
- Bullet points of what was modified

### Fixed
- Bullet points of bugs fixed

### Files Modified
- List of files changed
```
