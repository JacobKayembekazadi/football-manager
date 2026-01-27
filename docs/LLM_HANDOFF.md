# LLM Handoff Protocol

**Purpose**: Ensure continuity when different LLMs work on this codebase.  
**Rule**: ANY LLM completing work on this project MUST update this file and relevant docs.

---

## Current Session

| Field | Value |
|-------|-------|
| **LLM** | Gemini (Antigravity) |
| **Session Date** | 2026-01-21 |
| **Work Completed** | D14 Ops Transformation - Phase 1 COMPLETE |
| **Files Created** | `supabase/migrations/20260121000000_d14_ops_phase1.sql`, `services/opsTaskService.ts`, `services/activityLogService.ts`, `components/OpsCommandCentre.tsx` |
| **Files Modified** | `types.ts` (added D14 Ops types) |
| **Next Steps** | Apply database migration to Supabase, then start Phase 2: Runbooks |

---

## Active Initiative: D14 Ops Transformation

### Goal
Transform PitchSide AI from a Content/Commercial OS into a Football Operations Command Centre with:
- Task ownership system
- Matchday runbooks with dependencies
- "Continue" button (FM-style daily flow)
- Audit trail
- Escalation rules
- AI weekly "what broke" report

### Phase Status

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Core Infrastructure (DB, types, task service, activity log) | ✅ Complete |
| **Phase 2** | Runbooks (service, builder UI, task generation) | ⏳ Next |
| **Phase 3** | "Continue" UX (next task logic, dashboard) | ⬜ Pending |
| **Phase 4** | Escalations & AI Reporting | ⬜ Pending |

### Key Files to Read
1. `docs/CONTEXT.md` - Main LLM entry point
2. `docs/UPDATE.md` - Changelog and implementation history
3. `docs/LLM_HANDOFF.md` - This file (session continuity)
4. `implementation_plan.md` - Detailed plan in artifacts directory

---

## Handoff Checklist

When completing work, the LLM MUST:

- [ ] Update `Current Session` table above with your work
- [ ] Update `Phase Status` if phases were completed
- [ ] Add entry to `docs/UPDATE.md` changelog
- [ ] Update `docs/CONTEXT.md` if architecture changed
- [ ] Update `types.ts` JSDoc comments if types added
- [ ] Run `npm test` and document any failing tests

---

## Context Files (Priority Order)

| Priority | File | When to Read |
|----------|------|--------------|
| 1 | `docs/LLM_HANDOFF.md` | Always first - current state |
| 2 | `docs/CONTEXT.md` | Architecture overview |
| 3 | `types.ts` | Type definitions |
| 4 | `docs/UPDATE.md` | Recent changes |
| 5 | `App.tsx` | Main component structure |
| 6 | `database/schema.sql` | Database structure |

---

## Session History

### 2026-01-21 - Gemini (Antigravity)
- Analyzed codebase for D14 transformation
- Created implementation plan with 6 features
- Established phase-by-phase approach
- Created LLM handoff protocol (this file)

---

*This file must be updated by every LLM session that modifies the codebase.*
