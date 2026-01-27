# User Stories

This folder contains user stories organized by epic.

## Epic Index

| Epic | Stories | Status |
|------|---------|--------|
| [Content Automation](./epic-content-automation.md) | 6 | Complete |
| [Sponsor Management](./epic-sponsor-management.md) | 6 | Complete |
| [Operations Hub](./epic-operations-hub.md) | 7 | Complete |
| [Squad Management](./epic-squad-management.md) | 7 | Complete |
| [Authentication](./epic-authentication.md) | 10 | Complete |

---

## Story Status Legend

| Status | Meaning |
|--------|---------|
| ⬜ Draft | Story written, needs review |
| 🟡 Ready | Story approved, ready for dev |
| 🔵 In Progress | Development started |
| 🟢 Complete | Implemented and tested |
| 🔴 Blocked | Waiting on dependency |

---

## Story Template

When creating new stories, use this template:

```markdown
# Story: [Title]

## User Story
As a [role], I want to [action], so that [benefit].

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes
- Implementation details
- Database changes
- API requirements

## Design
- Figma link (if applicable)
- Screenshots / mockups

## QA Notes
- Test scenarios
- Edge cases to verify

## Dependencies
- List any blockers or prerequisites
```

---

## How to Use

### For Product Managers
1. Create new epic files for major features
2. Break down into individual stories
3. Prioritize stories within epics
4. Review with engineering for feasibility

### For Developers
1. Pick stories from "Ready" status
2. Update status to "In Progress"
3. Reference story in commit messages: `feat: [STORY-NAME] description`
4. Mark complete when merged and tested

### For QA
1. Review acceptance criteria before testing
2. Add additional test scenarios to QA Notes
3. Report bugs as GitHub issues, link to story
4. Sign off on completed stories

---

## Backlog (Future Epics)

- **Analytics Dashboard** - Usage metrics, content performance
- **Mobile App** - React Native companion app
- **Email Marketing** - Newsletter builder, campaign tracking
- **Video Generation** - AI-powered highlight reels
- **API Access** - Public API for integrations

---

*Last Updated: January 2025*
