# Epic: Sponsor Management (Sponsor Nexus)

## Overview
Comprehensive sponsor tracking, ROI reporting, and partnership management.

---

## Story 1: Add Sponsor Partnership

### User Story
As a **club administrator**, I want to **add a new sponsor to the system**, so that **I can track their partnership and ROI**.

### Acceptance Criteria
- [ ] Click "Add Sponsor" button
- [ ] Enter sponsor details (name, logo URL, tier)
- [ ] Select tier: Platinum / Gold / Silver
- [ ] Enter contract dates (start/end)
- [ ] Enter contact information
- [ ] Save creates sponsor record
- [ ] Sponsor appears in sponsor list

### Technical Notes
- `sponsors` table with club_id FK
- Tier affects default visibility/placement
- Logo URL optional (shows placeholder if missing)

### QA Notes
- Test with all tier options
- Test with past contract dates (should still allow)
- Verify logo displays correctly

---

## Story 2: Track Sponsor ROI Metrics

### User Story
As a **club administrator**, I want to **track ROI metrics for each sponsor**, so that **I can demonstrate value to partners**.

### Acceptance Criteria
- [ ] View sponsor detail page
- [ ] Enter/update impressions count
- [ ] Enter/update engagement count
- [ ] Enter/update click count
- [ ] Enter/update conversions count
- [ ] System calculates engagement rate
- [ ] System calculates CPM value
- [ ] Historical tracking over time

### Technical Notes
- ROI fields: `impressions`, `engagement`, `clicks`, `conversions`
- Calculated fields: `engagement_rate`, `estimated_value`
- Value formula: `(impressions / 1000) * CPM_RATE`

### QA Notes
- Test with zero values (should not divide by zero)
- Verify calculations are accurate
- Test large numbers

---

## Story 3: Generate Sponsor PDF Report

### User Story
As a **club administrator**, I want to **generate a professional PDF report for a sponsor**, so that **I can share value documentation with partners**.

### Acceptance Criteria
- [ ] Select sponsor
- [ ] Click "Generate Report" button
- [ ] PDF includes club branding
- [ ] PDF includes sponsor logo
- [ ] PDF shows ROI metrics
- [ ] PDF shows match appearances
- [ ] Professional formatting
- [ ] Downloads immediately

### Technical Notes
- Uses jsPDF library
- Client-side PDF generation
- Includes charts/graphs
- A4 format, branded colors

### QA Notes
- Test with sponsors with no logo
- Test with sponsors with minimal data
- Verify PDF opens in all viewers

---

## Story 4: Sponsor Tier Management

### User Story
As a **club administrator**, I want to **manage sponsor tier levels**, so that **I can prioritize visibility and benefits**.

### Acceptance Criteria
- [ ] View sponsors grouped by tier
- [ ] Platinum sponsors shown first/prominently
- [ ] Change sponsor tier
- [ ] Tier affects suggested placement in content
- [ ] Tier badge displayed on sponsor card

### Technical Notes
- Tiers: Platinum (highest), Gold, Silver
- Sort order: Platinum → Gold → Silver → Alphabetical
- Content generation mentions higher-tier sponsors

### QA Notes
- Test tier changes
- Verify sort order
- Test AI content mentions correct sponsors

---

## Story 5: Contract Expiration Alerts

### User Story
As a **club administrator**, I want to **receive alerts when sponsor contracts are expiring**, so that **I can initiate renewal conversations**.

### Acceptance Criteria
- [ ] Dashboard widget shows expiring sponsors
- [ ] Alert appears 30 days before expiration
- [ ] Red indicator for expired contracts
- [ ] Yellow indicator for expiring soon
- [ ] Click navigates to sponsor detail

### Technical Notes
- Query: `contract_end < NOW() + 30 days`
- Widget on main dashboard
- Optional email notification (future)

### QA Notes
- Test with various expiration dates
- Test with already expired sponsors
- Verify date calculations

---

## Story 6: AI Sponsor Activation Ideas

### User Story
As a **club administrator**, I want to **get AI-generated activation ideas for sponsors**, so that **I can maximize partnership value**.

### Acceptance Criteria
- [ ] View sponsor detail page
- [ ] Click "Generate Activation Ideas"
- [ ] AI suggests 3-5 activation concepts
- [ ] Ideas relevant to sponsor industry
- [ ] Ideas consider club assets (stadium, social media, matchdays)
- [ ] Save favorite ideas for later

### Technical Notes
- Gemini prompt includes: sponsor industry, club assets, audience
- Returns structured list of ideas
- Optional: cost estimate for each idea

### QA Notes
- Test with various sponsor industries
- Verify ideas are contextually relevant
- Test with minimal sponsor data

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Club exists | Required |
| jsPDF library | Installed |
| Gemini API (for activation ideas) | Required |

---

## Metrics

| Metric | Target |
|--------|--------|
| Report generation time | < 5s |
| Reports downloaded/month | 10+ |
| Sponsor retention rate | Track baseline |

---

*Epic Version: 1.0 | Last Updated: January 2025*
