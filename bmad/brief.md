# PitchSide AI - Product Brief

## Executive Summary

**PitchSide AI** is an AI-powered command center for grassroots and semi-professional football clubs. It automates content creation, tracks sponsor ROI, manages squad operations, and provides real-time fan sentiment analysis—all from a single dashboard.

---

## Problem Statement

Grassroots football clubs face significant operational challenges:

1. **Content Burden** - Clubs need to produce match previews, reports, and social media content for every fixture with limited resources
2. **Sponsor Justification** - Sponsors demand ROI proof but clubs lack tools to track and report value
3. **Operational Chaos** - Matchday tasks, equipment, and player availability are managed via WhatsApp and spreadsheets
4. **Fan Disconnect** - Clubs can't gauge fan sentiment or adapt messaging to community mood

---

## Solution

PitchSide AI provides:

| Feature | Description |
|---------|-------------|
| **The Hype Engine** | AI-generated match previews, reports, and social posts with one click |
| **Sponsor Nexus** | ROI tracking, PDF reports, and automated renewal pitch suggestions |
| **Operations Hub** | Matchday task templates, equipment management, and availability tracking |
| **Fan Sentiment** | Real-time Twitter analysis showing community mood (euphoric → angry) |
| **The Gaffer** | AI assistant for on-demand questions about squad, tactics, and content |

---

## Target Users

### Primary: Club Media Managers / Marketing Coordinators
- Age: 25-45
- Tech comfort: Moderate (uses Canva, social media scheduling tools)
- Pain points: Time-constrained, wears multiple hats, limited design skills

### Secondary: Club Operations Staff
- Role: Kit manager, match secretary, team manager
- Needs: Task tracking, equipment logs, availability management

### Tertiary: Club Executives / Sponsors
- Needs: ROI reports, professional documentation, brand visibility proof

---

## Key Differentiators

1. **Purpose-Built for Football** - Not a generic AI tool; understands fixtures, formations, squad dynamics
2. **Multi-Tenant by Design** - Each club's data is isolated; supports agency managing multiple clubs
3. **Demo Mode** - New users see realistic data immediately; no empty-screen confusion
4. **Offline-First Design** - Falls back to localStorage when Supabase unavailable

---

## Business Model

### Pricing Tiers (Proposed)

| Tier | Monthly | Features |
|------|---------|----------|
| **Starter** | Free | 1 club, 5 AI generations/month, demo mode |
| **Pro** | $29 | 1 club, unlimited AI, image generation, sentiment tracking |
| **Agency** | $99 | 5 clubs, team members, white-label reports, priority support |

---

## Success Metrics

| Metric | Target (Pilot) | Target (Launch) |
|--------|----------------|-----------------|
| Active Clubs | 5 | 50 |
| Content Generated/Club/Week | 3 | 10 |
| NPS Score | 40+ | 60+ |
| Sponsor Report Downloads | 10/month | 100/month |
| Daily Active Users | 80% | 60% |

---

## Pilot Program

**Goal**: Validate product-market fit with 5 grassroots clubs

**Duration**: 4 weeks

**Selection Criteria**:
- Active social media presence (posts 3+ times/week)
- 50+ followers on at least one platform
- Willing to provide feedback weekly

**Deliverables**:
- Onboarded pilot clubs with demo data
- Weekly feedback surveys
- Feature request prioritization
- Go/no-go decision for public launch

---

## Roadmap

### Phase 1: Core Platform (Complete)
- Authentication & multi-tenancy
- Squad management
- Fixture scheduling
- AI content generation
- Sponsor tracking

### Phase 2: Operations (Complete)
- Matchday task templates
- Equipment management
- Player availability
- Role-based permissions

### Phase 3: Intelligence (Complete)
- Fan sentiment tracking
- AI assistant (The Gaffer)
- Viral content scout

### Phase 4: Scale (Next)
- Scheduled content posting
- Email integration
- Mobile app
- Advanced analytics

---

## Competitive Landscape

| Competitor | Strengths | Weaknesses |
|------------|-----------|------------|
| Hootsuite/Buffer | Scheduling, analytics | Generic, no football context |
| Canva | Design templates | No AI generation, manual |
| TeamSnap | Team management | No content, no sponsors |
| Matchday FC | Football-specific | Limited AI, expensive |

**PitchSide AI Positioning**: The only AI-native platform built specifically for football club operations and content.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI costs spike | Medium | High | Budget alerts, BYOK option |
| Clubs resist AI content | Medium | Medium | Human-in-the-loop approval workflow |
| Sponsor ROI questioned | Low | High | Transparent methodology, benchmark data |
| Data breach | Low | Critical | RLS policies, audit logging, encryption |

---

## Team Requirements

| Role | Responsibility |
|------|----------------|
| Product Manager | Roadmap, pilots, feedback synthesis |
| Full-Stack Developer | Feature development, bug fixes |
| AI/ML Engineer | Prompt optimization, model selection |
| Customer Success | Pilot onboarding, support |

---

## Appendix: Technical Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **AI**: Google Gemini 2.5 Pro (server-side)
- **Images**: Ideogram + Imagen 3 (multi-provider)
- **Jobs**: Inngest (background workflows)
- **Deployment**: Vercel + Supabase Cloud

---

*Document Version: 1.0 | Last Updated: January 2025*
