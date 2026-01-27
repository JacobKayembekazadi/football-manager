# Epic: Squad Management

## Overview
Player roster management with stats tracking, AI analysis, and team building tools.

---

## Story 1: Add Player to Squad

### User Story
As a **team manager**, I want to **add players to my squad roster**, so that **I can track my team**.

### Acceptance Criteria
- [ ] Click "Add Player" button
- [ ] Enter player name
- [ ] Select position (GK/DEF/MID/FWD)
- [ ] Enter squad number (1-99)
- [ ] Mark as captain (optional)
- [ ] Upload photo (optional)
- [ ] Save creates player record
- [ ] Player appears in squad list

### Technical Notes
- `players` table with club_id FK
- Position enum: GK | DEF | MID | FWD
- Number unique within club
- Photo stored as URL (external hosting)

### QA Notes
- Test all positions
- Test duplicate number (should error)
- Test without photo

---

## Story 2: Track Player Stats

### User Story
As a **team manager**, I want to **record player stats**, so that **I can monitor performance**.

### Acceptance Criteria
- [ ] View player detail page
- [ ] Enter stats: pace, shooting, passing, dribbling, defending, physical
- [ ] Stats range: 0-99
- [ ] Radar chart visualizes stats
- [ ] Stats compared to position average
- [ ] Historical stat tracking (future)

### Technical Notes
- `stats` JSONB field on players table
- Stats: `{ pace, shooting, passing, dribbling, defending, physical }`
- Radar chart component with Chart.js

### QA Notes
- Test stat entry
- Test boundary values (0, 99)
- Verify radar chart renders

---

## Story 3: AI Player Analysis

### User Story
As a **team manager**, I want to **get AI-generated analysis for each player**, so that **I understand their strengths and development areas**.

### Acceptance Criteria
- [ ] View player detail page
- [ ] Click "Generate Analysis"
- [ ] AI produces 2-3 paragraph analysis
- [ ] Mentions strengths based on stats
- [ ] Suggests improvement areas
- [ ] Compares to ideal for position
- [ ] Analysis saved for future reference

### Technical Notes
- Gemini prompt includes: player stats, position, recent form
- Stored in player record or separate analysis table
- Regenerate option available

### QA Notes
- Test with various stat profiles
- Test with incomplete stats
- Verify analysis relevance

---

## Story 4: Player Form Tracking

### User Story
As a **team manager**, I want to **track player form over time**, so that **I can make selection decisions**.

### Acceptance Criteria
- [ ] Form rating: 1-10 scale
- [ ] Update form after each match
- [ ] Visual indicator (color coded)
- [ ] Form trend over last 5 matches
- [ ] Sort squad by form
- [ ] Highlight in-form players

### Technical Notes
- `form` field on players table (0-10)
- Form history (future): separate table
- Color scale: Green (8-10), Yellow (5-7), Red (1-4)

### QA Notes
- Test form updates
- Verify color coding
- Test sorting

---

## Story 5: Squad Overview Dashboard

### User Story
As a **team manager**, I want to **see an overview of my squad**, so that **I can assess team composition**.

### Acceptance Criteria
- [ ] View all players by position
- [ ] Position breakdown chart
- [ ] Average stats by position
- [ ] Identify gaps (low coverage positions)
- [ ] Quick filters (injured, available, form)
- [ ] Export squad list

### Technical Notes
- Dashboard widget
- Aggregate queries for stats
- Filter state in URL params

### QA Notes
- Test with various squad sizes
- Test empty squad state
- Verify charts render

---

## Story 6: Player Profile Management

### User Story
As a **team manager**, I want to **maintain complete player profiles**, so that **all information is centralized**.

### Acceptance Criteria
- [ ] Contact details (phone, email)
- [ ] Emergency contact
- [ ] Medical notes (allergies, conditions)
- [ ] Contract dates (if applicable)
- [ ] Narrative tags (for marketing/branding)
- [ ] Social media handles
- [ ] Privacy controls

### Technical Notes
- Extended player fields
- Sensitive data encrypted at rest
- Permission-gated access to contact info

### QA Notes
- Test data entry
- Test privacy controls
- Verify emergency contact display

---

## Story 7: Delete/Archive Player

### User Story
As a **team manager**, I want to **remove players who have left**, so that **my squad is current**.

### Acceptance Criteria
- [ ] Delete player option
- [ ] Confirmation dialog required
- [ ] Soft delete (archive) option
- [ ] Archived players hidden by default
- [ ] Can view archived players
- [ ] Can restore archived players
- [ ] Historical data preserved

### Technical Notes
- `deleted_at` timestamp for soft delete
- Default query excludes deleted
- Restore clears `deleted_at`

### QA Notes
- Test delete flow
- Test confirmation dialog
- Test restore functionality

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Club exists | Required |
| Auth configured | Required |
| Gemini API (for analysis) | Optional |

---

## Metrics

| Metric | Target |
|--------|--------|
| Players per club | 15-30 |
| Profile completeness | > 80% |
| Stats tracked | > 90% |

---

*Epic Version: 1.0 | Last Updated: January 2025*
