# Epic: Operations Hub

## Overview
Matchday task management, equipment tracking, and player availability coordination.

---

## Story 1: Enable Task Template Packs

### User Story
As an **operations manager**, I want to **enable pre-built task template packs**, so that **matchday checklists are automatically populated**.

### Acceptance Criteria
- [ ] View available template packs
- [ ] See pack description and task count
- [ ] Toggle pack on/off
- [ ] Enabled packs auto-generate tasks for new fixtures
- [ ] See total task count from enabled packs
- [ ] Packs include: Matchday (Home/Away), Training, Equipment, Media

### Technical Notes
- `template_packs` table with `is_enabled` flag
- `fixture_tasks` generated from enabled packs
- Trigger on fixture creation
- Default packs seeded from `DEFAULT_TEMPLATE_PACKS`

### QA Notes
- Test enabling/disabling packs
- Verify tasks appear for new fixtures
- Test with no packs enabled

---

## Story 2: Complete Matchday Tasks

### User Story
As an **operations staff member**, I want to **view and complete my assigned tasks**, so that **matchday preparation is tracked**.

### Acceptance Criteria
- [ ] View tasks for selected fixture
- [ ] See task owner and due time
- [ ] Check off tasks as completed
- [ ] Completed tasks show timestamp
- [ ] Progress bar shows completion percentage
- [ ] Filter by status (pending/done)
- [ ] Filter by owner

### Technical Notes
- `fixture_tasks` table with `status` field
- Status: pending | in_progress | done
- `completed_at` timestamp when done
- Real-time updates via Supabase subscription

### QA Notes
- Test completing tasks
- Test undo completion
- Verify progress calculation

---

## Story 3: Assign Task Ownership

### User Story
As an **admin**, I want to **assign tasks to specific team members**, so that **responsibilities are clear**.

### Acceptance Criteria
- [ ] Select task
- [ ] Assign primary owner from club users
- [ ] Optionally assign backup owner
- [ ] Owner sees task in "My Tasks" view
- [ ] Email notification to owner (optional)
- [ ] Reassign tasks if needed

### Technical Notes
- `owner_user_id` and `backup_user_id` on fixture_tasks
- `owner_role` for role-based assignment
- Permission: `tasks:assign`

### QA Notes
- Test assigning to various users
- Test reassignment
- Verify "My Tasks" filtering

---

## Story 4: Track Player Availability

### User Story
As a **team manager**, I want to **track player availability for each fixture**, so that **I can plan team selection**.

### Acceptance Criteria
- [ ] Select fixture
- [ ] View all squad players
- [ ] Set availability: Available / Unavailable / Maybe / Injured
- [ ] Add note (e.g., "Working late")
- [ ] See summary counts per status
- [ ] Filter players by position
- [ ] Persist availability between sessions

### Technical Notes
- `player_availability` table: player_id, fixture_id, status, note
- Status enum: available | unavailable | maybe | injured | no_response
- Initialize with `no_response` for all players

### QA Notes
- Test all status options
- Test with notes
- Verify persistence

---

## Story 5: Equipment Management

### User Story
As a **kit manager**, I want to **track equipment assignments and inventory**, so that **nothing is forgotten on matchday**.

### Acceptance Criteria
- [ ] View player kit assignments
- [ ] Assign kit sizes to players
- [ ] Track shared equipment (balls, cones, first aid)
- [ ] Matchday checklist integration
- [ ] Low stock alerts
- [ ] Laundry batch tracking

### Technical Notes
- `player_kit_assignments`: player_id, kit_size, number
- `club_equipment`: category, name, quantity, condition
- `laundry_batches`: status, items

### QA Notes
- Test kit assignment
- Test equipment CRUD
- Test laundry workflow

---

## Story 6: Task Handover

### User Story
As a **task owner**, I want to **hand over my tasks when unavailable**, so that **nothing is missed**.

### Acceptance Criteria
- [ ] Select tasks to hand over
- [ ] Choose recipient from club users
- [ ] Add handover note
- [ ] Recipient notified
- [ ] Task ownership transfers
- [ ] Audit trail maintained

### Technical Notes
- `handover_requests` table
- Status: pending | accepted | declined
- Triggers task reassignment on accept
- Audit event logged

### QA Notes
- Test handover flow
- Test decline scenario
- Verify audit logging

---

## Story 7: At-Risk Task Alerts

### User Story
As an **admin**, I want to **see alerts for at-risk or overdue tasks**, so that **I can intervene**.

### Acceptance Criteria
- [ ] Dashboard widget shows at-risk tasks
- [ ] At-risk: < 2 hours to due time, not started
- [ ] Overdue: past due time, not completed
- [ ] Red badge for overdue
- [ ] Yellow badge for at-risk
- [ ] Click navigates to task

### Technical Notes
- Query: `due_at < NOW() AND status != 'done'`
- Real-time widget updates
- Optional: push notification

### QA Notes
- Test with various due times
- Verify color coding
- Test widget refresh

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Club users setup | Required |
| Fixtures exist | Required for tasks |
| Template packs defined | Recommended |

---

## Metrics

| Metric | Target |
|--------|--------|
| Task completion rate | > 95% |
| On-time completion | > 90% |
| Availability response rate | > 80% |

---

*Epic Version: 1.0 | Last Updated: January 2025*
