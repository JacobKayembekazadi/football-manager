# D14 / PitchSide - Feature Specifications

**Last Updated:** 2026-01-21  
**Updated By:** Claude (Opus 4.5)

---

## Independence & Leverage

**Goal:** The club can run matchday + ops without relying on any single person. Work continues even when volunteers change, people are busy, or someone disappears.

### Implementation Phases

---

### Phase 1: Users & Roles Foundation

**Status:** 🔄 In Progress

#### Data Model

```typescript
// types.ts additions

interface ClubUser {
  id: string;
  club_id: string;
  user_id: string;          // Links to Supabase auth.users
  email: string;
  name: string;
  avatar_url?: string;
  status: 'active' | 'inactive' | 'unavailable';
  created_at: string;
}

interface Role {
  id: string;
  club_id: string;
  name: string;             // 'Admin' | 'Coach' | 'Ops' | 'Media' | 'Kit' | 'Finance'
  color: string;            // For UI badges
  is_system: boolean;       // Prevent deletion of core roles
}

interface UserRole {
  user_id: string;
  role_id: string;
  is_primary: boolean;      // User's main role for default assignment
}
```

#### New Files

| File | Purpose |
|------|---------|
| `services/userService.ts` | CRUD for club users |
| `services/roleService.ts` | CRUD for roles + user-role assignments |
| `components/TeamSettings.tsx` | UI for managing users and roles |
| `components/UserAvatar.tsx` | Reusable avatar component |
| `components/RoleBadge.tsx` | Styled role badge |
| `components/InviteUserModal.tsx` | Invite flow |

#### Default Roles (Seeded on Club Creation)

| Role | Color | System |
|------|-------|--------|
| Admin | red | true |
| Coach | blue | true |
| Ops | purple | true |
| Media | pink | true |
| Kit | amber | true |
| Finance | green | false |

#### Acceptance Criteria

- [ ] Users can be added to a club (invite by email or link)
- [ ] Users can be assigned one or more roles
- [ ] One role is marked as primary (for default assignment)
- [ ] Users can be marked as unavailable
- [ ] User avatars display throughout the app
- [ ] Demo mode has mock users pre-populated

---

### Phase 2: RBAC / Permissions

**Status:** ⏳ Pending

#### Data Model

```typescript
interface Permission {
  role_id: string;
  module: string;           // 'fixtures' | 'content' | 'equipment' | etc.
  action: string;           // 'view' | 'create' | 'edit' | 'delete' | 'approve'
}
```

#### Permission Matrix (Defaults)

| Module | Admin | Coach | Ops | Media | Kit | Finance |
|--------|-------|-------|-----|-------|-----|---------|
| fixtures | full | edit | view | view | view | view |
| content | full | view | view | full | view | view |
| equipment | full | view | full | view | full | view |
| squad | full | full | view | view | view | view |
| finance | full | - | - | - | - | full |
| settings | full | - | - | - | - | - |
| templates | full | view | edit | edit | edit | - |

#### New Files

| File | Purpose |
|------|---------|
| `services/permissionService.ts` | Permission checks |
| `hooks/usePermission.ts` | React hook for permission checks |
| `components/PermissionGate.tsx` | Wrapper to hide unauthorized content |

#### Acceptance Criteria

- [ ] Users only see modules they have permission to view
- [ ] Forbidden routes return 403 (defense in depth)
- [ ] Admin can customize permissions per role
- [ ] UI hides (not disables) forbidden actions

---

### Phase 3: Task Ownership + Backup

**Status:** ⏳ Pending

#### Data Model Changes

```typescript
// Extend FixtureTask
interface FixtureTask {
  // ...existing fields
  owner_user_id: string | null;
  backup_user_id: string | null;
  owner_role: string | null;    // Fallback for claiming
}
```

#### UI Changes

- Task cards show owner avatar + backup badge
- Click avatar to reassign
- "Assign to me" shortcut
- Unassigned tasks show role badge (claimable)

#### Acceptance Criteria

- [ ] Every matchday task requires an owner
- [ ] Backup is optional but recommended
- [ ] Unassigned tasks can be "claimed" by role members
- [ ] Warning shown when owner is unavailable

---

### Phase 4: Volunteer-proof Templates

**Status:** ⏳ Pending

#### Data Model Changes

```typescript
interface TemplatePack {
  // ...existing fields
  auto_apply: 'never' | 'home' | 'away' | 'always';
  default_owner_role: string | null;
}

interface TemplateTask {
  // ...existing fields
  default_owner_role: string | null;
  default_backup_role: string | null;
}
```

#### Behavior

- When fixture created, matching pack auto-applies
- Tasks auto-assigned to user with matching primary role
- New volunteers inherit templates immediately

#### Acceptance Criteria

- [ ] Templates can specify default owner role per task
- [ ] Auto-apply based on Home/Away venue
- [ ] New users auto-assigned to future fixtures

---

### Phase 5: Audit Trail

**Status:** ⏳ Pending

#### Data Model

```typescript
interface AuditEvent {
  id: string;
  club_id: string;
  fixture_id?: string;
  task_id?: string;
  actor_user_id: string;
  event_type: AuditEventType;
  payload: Record<string, any>;
  created_at: string;
}

type AuditEventType =
  | 'task.created'
  | 'task.claimed'
  | 'task.completed'
  | 'task.reopened'
  | 'task.reassigned'
  | 'task.blocked'
  | 'content.approved'
  | 'content.published'
  | 'fixture.created'
  | 'handover.executed'
  | 'user.marked_unavailable';
```

#### New Files

| File | Purpose |
|------|---------|
| `services/auditService.ts` | Log and query audit events |
| `components/ActivityPanel.tsx` | Timeline UI for audit events |

#### Acceptance Criteria

- [ ] All write operations logged with actor + timestamp
- [ ] Activity panel on fixture detail view
- [ ] Filterable by event type
- [ ] No debate about "who did what"

---

### Phase 6: Quick Handover

**Status:** ⏳ Pending

#### UI: Handover Modal

```
Reassigning from: [User Dropdown]
Scope: All fixtures / This fixture / This pack
Assign to: Specific person / Role (first available)
Tasks affected: N
[Cancel] [Handover Tasks]
```

#### Optional: Auto-Handover Rules

```typescript
interface HandoverRule {
  trigger: 'owner_unavailable' | 'overdue_4h' | 'no_response_24h';
  action: 'assign_backup' | 'assign_role' | 'notify_admin';
  notify: boolean;
}
```

#### Acceptance Criteria

- [ ] Admin can reassign all tasks in < 10 seconds
- [ ] Bulk reassignment by fixture or pack
- [ ] Optional auto-handover on availability change
- [ ] Audit event logged for handover

---

### Phase 7: Exception Alerts

**Status:** ⏳ Pending

#### Risk Levels

```typescript
type RiskLevel = 'ok' | 'warning' | 'critical';

// Warning: due in < 2h, unassigned
// Critical: overdue, blocked
```

#### Manager Dashboard Widget

- Shows at-risk count (red/amber)
- Drill-down to specific items
- One-click resolve options

#### Weekly Digest

- What got done
- What's stuck
- AI-generated suggestions

#### Notification Philosophy

- **DO NOT** notify on every completion
- **DO** notify only on: assignments, blocks, exceptions
- Configurable digest frequency

#### Acceptance Criteria

- [ ] At-risk widget on dashboard
- [ ] Notification only on exceptions
- [ ] Weekly digest email/in-app
- [ ] Suggestions based on patterns

---

## Future Features (Not Yet Specified)

- Multi-club dashboard for admins managing multiple teams
- Public fixture/results widget for club website
- Sponsor management and ad placement
- Financial tracking (income/expenses) - minimal, not core
- Integration with Pitchero (import fixtures, sync squad)
