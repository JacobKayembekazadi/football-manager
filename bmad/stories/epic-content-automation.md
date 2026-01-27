# Epic: Content Automation (The Hype Engine)

## Overview
AI-powered content generation for match previews, reports, and social media posts.

---

## Story 1: Generate Match Preview

### User Story
As a **media manager**, I want to **generate an AI match preview for an upcoming fixture**, so that **I can have professional content ready without manual writing**.

### Acceptance Criteria
- [ ] Select an upcoming fixture from the fixture list
- [ ] Click "Generate Preview" button
- [ ] AI generates a 200-300 word match preview
- [ ] Preview includes: opponent info, recent form, key players to watch
- [ ] Content saved as DRAFT status
- [ ] User can edit the generated content
- [ ] User can regenerate if unhappy with result

### Technical Notes
- Uses Gemini 2.5 Pro via `/api/ai-generate`
- System prompt includes club context, squad info, recent results
- Content type: `PREVIEW`

### QA Notes
- Test with various opponent names
- Test with missing fixture data (should gracefully handle)
- Verify content quality is contextually relevant

---

## Story 2: Generate Match Report

### User Story
As a **media manager**, I want to **generate an AI match report after a completed fixture**, so that **I can quickly publish post-match content**.

### Acceptance Criteria
- [ ] Available only for COMPLETED fixtures
- [ ] Includes match stats (goals, possession, shots)
- [ ] Mentions key moments (goalscorers, substitutions)
- [ ] Professional sports journalism tone
- [ ] Content saved as DRAFT
- [ ] Can be edited before publishing

### Technical Notes
- Requires fixture.status === 'COMPLETED'
- Requires match_stats data (or generates generic report)
- Content type: `REPORT`

### QA Notes
- Test with minimal match data
- Test with full match stats
- Verify goalscorer names are included

---

## Story 3: Generate Social Media Post

### User Story
As a **media manager**, I want to **generate social media captions for matchday content**, so that **I have platform-optimized posts ready**.

### Acceptance Criteria
- [ ] Generate Twitter-optimized post (280 chars)
- [ ] Generate Instagram caption (longer, with hashtags)
- [ ] Include relevant emojis (optional toggle)
- [ ] Include call-to-action (ticket link, watch link)
- [ ] Platform selector (Twitter/Instagram/Facebook)

### Technical Notes
- Content type: `SOCIAL` or `CAPTION`
- Different prompts per platform
- Character count validation in UI

### QA Notes
- Verify Twitter post under 280 chars
- Verify hashtags are relevant
- Test with various fixture contexts

---

## Story 4: Content Approval Workflow

### User Story
As an **editor**, I want to **review and approve AI-generated content before publishing**, so that **quality is maintained**.

### Acceptance Criteria
- [ ] View all DRAFT content in Content Hub
- [ ] Preview content in read mode
- [ ] Edit content inline
- [ ] Approve button moves to APPROVED status
- [ ] Publish button moves to PUBLISHED status
- [ ] Option to reject and regenerate

### Technical Notes
- Status flow: DRAFT → APPROVED → PUBLISHED
- Permission check: requires 'content:approve' permission
- Audit log entry on status change

### QA Notes
- Verify status transitions work
- Verify permission enforcement
- Test concurrent edits (should warn)

---

## Story 5: Generate Matchday Graphics

### User Story
As a **media manager**, I want to **generate AI matchday graphics**, so that **I have professional visuals without design skills**.

### Acceptance Criteria
- [ ] Select graphic type (Matchday, Result, Lineup)
- [ ] Choose style (Hype, Minimal, Retro, Neon)
- [ ] AI generates image with text overlays
- [ ] Correct scores/dates displayed
- [ ] Club colors applied
- [ ] Download as PNG
- [ ] Option to regenerate

### Technical Notes
- Uses multi-provider: Ideogram (text-heavy) → Imagen 3 (quality)
- Prompt includes club branding, opponent, date
- Returns base64 or URL

### QA Notes
- Test all style options
- Verify text is readable in generated images
- Test with long opponent names

---

## Story 6: Bulk Content Download

### User Story
As a **media manager**, I want to **download all matchday content as a ZIP file**, so that **I can easily share with volunteers or upload elsewhere**.

### Acceptance Criteria
- [ ] Select multiple content items
- [ ] Click "Download as ZIP"
- [ ] ZIP contains text files and images
- [ ] Files named by type (preview.txt, graphic.png)
- [ ] Toast notification on success

### Technical Notes
- Uses JSZip library
- Client-side ZIP generation
- Includes images as base64 decoded

### QA Notes
- Test with large number of items
- Verify ZIP opens correctly
- Test with missing images

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Gemini API key configured | Required |
| Ideogram API key (for images) | Optional |
| Fixture data exists | Required |
| Club data exists | Required |

---

## Metrics

| Metric | Target |
|--------|--------|
| Time to generate preview | < 10s |
| Time to generate image | < 30s |
| User satisfaction (survey) | > 80% |
| Content approval rate | > 90% |

---

*Epic Version: 1.0 | Last Updated: January 2025*
