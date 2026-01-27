# PitchSide AI - Documentation Index

## Overview

This document serves as the central index for all PitchSide AI documentation.

---

## BMAD Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| [brief.md](./brief.md) | Product brief, problem statement, target users | Product, Leadership |
| [architecture.md](./architecture.md) | Technical architecture, data models, APIs | Engineering |
| [qa.md](./qa.md) | QA strategy, test plans, checklists | QA, Engineering |
| [stories/](./stories/) | User stories and acceptance criteria | Product, Engineering |

---

## Existing Documentation (`/docs`)

### For Developers

| Document | Description |
|----------|-------------|
| `ARCHITECTURE.md` | System architecture overview |
| `DEVELOPMENT_GUIDE.md` | Local setup and development |
| `IMPLEMENTATION_PLAN.md` | Feature roadmap and phases |
| `API_DOCUMENTATION.md` | Service API reference |
| `DATA_MODEL.md` | Database schema reference |

### For Operations

| Document | Description |
|----------|-------------|
| `DEPLOYMENT.md` | Production deployment steps |
| `PRODUCTION_READINESS_CHECKLIST.md` | Go-live verification |
| `RUNBOOK.md` | Operational procedures |
| `PILOT_ADMIN_CHECKLIST.md` | Pilot launch checklist |

### For Users

| Document | Description |
|----------|-------------|
| `USERGUIDE.md` | End-user documentation |
| `PILOT_QUICKSTART.md` | Quick start guide for pilots |
| `USECASES.md` | Feature specifications |
| `FEATURE_SPECS.md` | Detailed requirements |

### For AI

| Document | Description |
|----------|-------------|
| `AI_OPERATIONS.md` | AI integration architecture |
| `AI_PROMPTS.md` | Prompt engineering guide |
| `IMAGE_GENERATION.md` | Multi-provider image generation |

---

## Quick Links

### Getting Started
1. [Development Setup](../docs/DEVELOPMENT_GUIDE.md)
2. [Architecture Overview](./architecture.md)
3. [Product Brief](./brief.md)

### For New Team Members
1. Read [brief.md](./brief.md) to understand the product
2. Read [architecture.md](./architecture.md) for technical context
3. Follow [DEVELOPMENT_GUIDE.md](../docs/DEVELOPMENT_GUIDE.md) to set up locally
4. Review [stories/](./stories/) for current work

### For Pilots
1. [PILOT_QUICKSTART.md](../docs/PILOT_QUICKSTART.md) - Getting started
2. [PILOT_ADMIN_CHECKLIST.md](../docs/PILOT_ADMIN_CHECKLIST.md) - Admin setup

---

## Documentation Standards

### File Naming
- Use `UPPERCASE_SNAKE_CASE.md` for docs
- Use `lowercase-kebab-case.md` for stories
- Prefix stories with ticket/issue number if applicable

### Document Structure
```markdown
# Title

## Overview
Brief description of the document purpose.

---

## Section 1
Content...

## Section 2
Content...

---

*Document Version: X.X | Last Updated: Month Year*
```

### Story Format
```markdown
# Story: [Title]

## User Story
As a [role], I want to [action], so that [benefit].

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Technical Notes
- Implementation details
- Dependencies

## Design
- Figma link (if applicable)
- Screenshots

## QA Notes
- Test scenarios
- Edge cases
```

---

## Glossary

| Term | Definition |
|------|------------|
| **Club** | A football club entity in the system |
| **Org** | Organization/workspace (multi-tenant boundary) |
| **Fixture** | A scheduled or completed match |
| **Content Item** | Generated content (preview, report, social post) |
| **Template Pack** | Predefined task checklist for matchdays |
| **The Gaffer** | AI assistant feature |
| **Hype Engine** | AI content automation system |
| **Sponsor Nexus** | Sponsor management module |
| **RLS** | Row Level Security (Supabase) |
| **BYOK** | Bring Your Own Key (user-provided API keys) |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2025 | Initial BMAD documentation |

---

## Contributing to Docs

1. **Create a branch**: `docs/your-doc-name`
2. **Write in Markdown**: Follow the standards above
3. **Update this index**: Add entry to appropriate section
4. **Submit PR**: Tag documentation reviewer

---

## Feedback

Found an issue with the docs? Have suggestions?

- Create a GitHub issue with label `documentation`
- Or contact: [your-email@example.com]

---

*Document Version: 1.0 | Last Updated: January 2025*
