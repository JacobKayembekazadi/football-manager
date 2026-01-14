# PitchSide AI - Production Readiness Implementation Plan

**Created**: January 2026
**Target Completion**: 6 Phases
**Current Status**: Planning

---

## Executive Summary

This plan outlines the systematic approach to bring PitchSide AI from feature-complete to production-ready. Work is organized into 6 phases, prioritized by criticality and logical dependencies.

| Phase | Focus | Priority | Estimated Effort |
|-------|-------|----------|------------------|
| 1 | Security Hardening | 🔴 Critical | High |
| 2 | Stability & Bug Fixes | 🔴 Critical | Medium |
| 3 | Monitoring & Observability | 🟠 High | Medium |
| 4 | Testing & Quality | 🟠 High | Medium |
| 5 | UX Polish & Performance | 🟡 Medium | Medium |
| 6 | Future Enhancements | 🟢 Low | Ongoing |

---

## Phase 1: Security Hardening 🔴

**Goal**: Ensure the application is secure for production use

### 1.1 CORS Configuration
**Files**: `supabase/functions/*/index.ts`

**Current State**:
```typescript
'Access-Control-Allow-Origin': '*'
```

**Target State**:
```typescript
const ALLOWED_ORIGINS = [
  'https://pitchside.ai',
  'https://app.pitchside.ai',
  process.env.NODE_ENV === 'development' && 'http://localhost:3000'
].filter(Boolean);

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};
```

**Tasks**:
- [ ] Update `ai-generate` Edge Function with CORS restrictions
- [ ] Update `ai-settings` Edge Function with CORS restrictions
- [ ] Update `fan-sentiment` Edge Function with CORS restrictions
- [ ] Update `send-email` Edge Function with CORS restrictions
- [ ] Create shared CORS utility for Edge Functions
- [ ] Test CORS with production domain

**Acceptance Criteria**:
- Cross-origin requests only work from allowed domains
- OPTIONS preflight requests handled correctly
- Development mode allows localhost

---

### 1.2 Rate Limiting
**Files**: `supabase/functions/*/index.ts`, new `supabase/functions/_shared/rateLimit.ts`

**Implementation**:
```typescript
// _shared/rateLimit.ts
interface RateLimitConfig {
  windowMs: number;      // Time window in ms
  maxRequests: number;   // Max requests per window
  keyGenerator: (req: Request) => string;
}

// Use Supabase KV or in-memory Map with TTL
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: config.maxRequests - record.count, resetAt: record.resetAt };
}
```

**Rate Limits by Endpoint**:
| Endpoint | Limit | Window |
|----------|-------|--------|
| `ai-generate` | 20 requests | 1 minute |
| `ai-generate` (per org) | 100 requests | 1 hour |
| `fan-sentiment` | 10 requests | 1 minute |
| `send-email` | 50 emails | 1 hour |

**Tasks**:
- [ ] Create shared rate limiting utility
- [ ] Implement rate limiting on `ai-generate`
- [ ] Implement rate limiting on `fan-sentiment`
- [ ] Implement rate limiting on `send-email`
- [ ] Add rate limit headers to responses
- [ ] Create rate limit exceeded error handling
- [ ] Test rate limiting under load

**Acceptance Criteria**:
- Excessive requests return 429 Too Many Requests
- Rate limit headers included (X-RateLimit-Remaining, X-RateLimit-Reset)
- Different limits per endpoint type

---

### 1.3 Password Policy Enhancement
**Files**: `components/AuthScreen.tsx`, `services/authService.ts`

**Current**: 6 character minimum
**Target**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Password strength indicator

**Tasks**:
- [ ] Create password validation utility
- [ ] Add password strength indicator component
- [ ] Update AuthScreen with validation feedback
- [ ] Configure Supabase password requirements
- [ ] Add password requirements tooltip

**Acceptance Criteria**:
- Weak passwords rejected with helpful message
- Visual strength indicator (weak/medium/strong)
- Requirements clearly communicated

---

### 1.4 Input Sanitization
**Files**: All form components, Edge Functions

**Tasks**:
- [ ] Audit all user input fields
- [ ] Add XSS protection (escape HTML in text fields)
- [ ] Validate and sanitize AI prompt inputs
- [ ] Add SQL injection protection (parameterized queries only)
- [ ] Sanitize file names for ZIP downloads
- [ ] Review content rendering for XSS vectors

**Implementation**:
```typescript
// utils/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

export function sanitizeForDisplay(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

**Acceptance Criteria**:
- No XSS vulnerabilities in user-generated content
- All database queries use parameterized statements
- AI prompts sanitized before processing

---

### 1.5 Email Verification Enforcement
**Files**: `components/AuthScreen.tsx`, Supabase Auth settings

**Tasks**:
- [ ] Enable email verification in Supabase Dashboard
- [ ] Create email verification pending screen
- [ ] Add "Resend verification email" button
- [ ] Configure custom email templates
- [ ] Handle unverified user access attempts

**Acceptance Criteria**:
- New users must verify email before accessing app
- Clear messaging about verification requirement
- Resend option available

---

### 1.6 Security Headers
**Files**: `vercel.json` or Edge Function responses

**Headers to Add**:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co" }
      ]
    }
  ]
}
```

**Tasks**:
- [ ] Create/update `vercel.json` with security headers
- [ ] Test CSP doesn't break functionality
- [ ] Verify headers in production

**Acceptance Criteria**:
- All security headers present in responses
- No functionality broken by CSP

---

## Phase 2: Stability & Bug Fixes 🔴

**Goal**: Fix known issues and ensure stable operation

### 2.1 UUID/Seeding Fixes
**Files**: `services/mockDataService.ts`, `types.ts`

**Problem**: Mock data uses string IDs like `"1"` instead of UUIDs, causing 400/406 errors when Supabase expects UUID format.

**Tasks**:
- [ ] Update mock data to use valid UUID format
- [ ] Create UUID generator utility for demo data
- [ ] Update `mockDataService.ts` seeding logic
- [ ] Fix ID type mismatches in `types.ts`
- [ ] Test seeding with fresh database
- [ ] Verify no more 400/406 errors

**Implementation**:
```typescript
// utils/uuid.ts
export function generateDemoUUID(prefix: string, index: number): string {
  // Generate deterministic UUIDs for demo data
  const base = '00000000-0000-4000-8000-';
  const suffix = (prefix.charCodeAt(0) * 1000 + index).toString().padStart(12, '0');
  return base + suffix;
}

// Usage in mockDataService.ts
const demoPlayers = [
  { id: generateDemoUUID('player', 1), name: 'Marcus Sterling', ... },
  { id: generateDemoUUID('player', 2), name: 'James Rodriguez', ... },
];
```

**Acceptance Criteria**:
- Demo data seeds without errors
- No 400/406 errors in browser console
- Mock data IDs are valid UUIDs

---

### 2.2 Content Schedule Button
**Files**: `components/ContentHub.tsx`

**Problem**: "Add Content" button in Schedule tab not functional

**Tasks**:
- [ ] Wire up onClick handler for "Add Content" button
- [ ] Open ContentEditorModal with fixture context
- [ ] Pre-select fixture and content slot
- [ ] Test full flow from Schedule → Edit → Save

**Acceptance Criteria**:
- Button opens content editor modal
- Fixture context passed correctly
- New content saves and appears in schedule

---

### 2.3 Color Palette Cleanup
**Files**: `components/SquadView.tsx`, `components/PlayerCard.tsx`, `components/ContentPipeline.tsx`

**Problem**: Some components still have neon gradients instead of calm FM-style palette

**Tasks**:
- [ ] Audit all components for neon color usage
- [ ] Replace `from-blue-500` / `from-purple-500` with `from-brand-500`
- [ ] Update gradient backgrounds to use slate/navy
- [ ] Ensure consistent color usage across all views
- [ ] Test dark mode appearance

**Color Reference**:
```css
/* Correct FM-style palette */
--brand-500: #22c55e;      /* Primary green */
--accent-purple: #9333ea;   /* Accent purple */
--bg-primary: #0f172a;      /* Deep navy */
--bg-secondary: #1e293b;    /* Slate */
```

**Acceptance Criteria**:
- No neon blues/purples remaining
- Consistent calm color palette
- Professional FM-inspired look

---

### 2.4 Error Boundary Improvements
**Files**: `components/ErrorBoundary.tsx`

**Tasks**:
- [ ] Add error reporting integration hook
- [ ] Improve error UI with retry button
- [ ] Add "Report this issue" link
- [ ] Capture component stack for debugging
- [ ] Add recovery suggestions

**Acceptance Criteria**:
- Errors caught gracefully
- Users can retry or navigate away
- Error details captured for debugging

---

## Phase 3: Monitoring & Observability 🟠

**Goal**: Gain visibility into production behavior

### 3.1 Error Monitoring (Sentry)
**Files**: `App.tsx`, `vite.config.ts`, new `services/errorReporting.ts`

**Tasks**:
- [ ] Install Sentry: `npm install @sentry/react`
- [ ] Create Sentry project
- [ ] Initialize Sentry in App.tsx
- [ ] Configure source maps upload in build
- [ ] Set up error boundaries with Sentry
- [ ] Add user context to errors
- [ ] Configure alert rules

**Implementation**:
```typescript
// services/errorReporting.ts
import * as Sentry from '@sentry/react';

export function initErrorReporting() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, { extra: context });
}

export function setUser(user: { id: string; email: string; orgId: string }) {
  Sentry.setUser({ id: user.id, email: user.email });
  Sentry.setTag('org_id', user.orgId);
}
```

**Acceptance Criteria**:
- Errors reported to Sentry dashboard
- User and org context attached
- Source maps enable readable stack traces

---

### 3.2 Analytics Integration
**Files**: `App.tsx`, new `services/analytics.ts`

**Tasks**:
- [ ] Choose provider (Plausible recommended for privacy)
- [ ] Install analytics package
- [ ] Track key events:
  - [ ] User signup
  - [ ] Content generated
  - [ ] Sponsor added
  - [ ] PDF exported
  - [ ] Sentiment refresh
- [ ] Create analytics dashboard

**Implementation (Plausible)**:
```typescript
// services/analytics.ts
export function trackEvent(name: string, props?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(name, { props });
  }
}

// Usage
trackEvent('content_generated', { type: 'match_report', club_id: clubId });
```

**Acceptance Criteria**:
- Key user actions tracked
- Dashboard shows usage patterns
- No PII in analytics

---

### 3.3 Uptime Monitoring
**Tasks**:
- [ ] Set up uptime monitor (UptimeRobot, Checkly, or similar)
- [ ] Monitor endpoints:
  - [ ] Frontend (Vercel URL)
  - [ ] Supabase health
  - [ ] Edge Functions
- [ ] Configure alerting (email, Slack)
- [ ] Create status page

**Acceptance Criteria**:
- Downtime detected within 1 minute
- Alerts sent to appropriate channels
- Status page publicly accessible

---

### 3.4 Database Monitoring
**Tasks**:
- [ ] Enable Supabase database insights
- [ ] Set up slow query alerts
- [ ] Monitor connection pool usage
- [ ] Configure storage alerts
- [ ] Review query performance weekly

**Acceptance Criteria**:
- Slow queries identified
- Storage usage visible
- Alerts before limits hit

---

## Phase 4: Testing & Quality 🟠

**Goal**: Ensure confidence in deployments

### 4.1 End-to-End Tests (Playwright)
**Files**: New `e2e/` directory

**Tasks**:
- [ ] Install Playwright: `npm install -D @playwright/test`
- [ ] Configure playwright.config.ts
- [ ] Write critical path tests:
  - [ ] User signup/login flow
  - [ ] Create workspace and club
  - [ ] Add player to squad
  - [ ] Schedule fixture
  - [ ] Generate content
  - [ ] Add sponsor with ROI data
  - [ ] Export PDF report
- [ ] Set up CI/CD integration
- [ ] Configure test database

**Test Structure**:
```
e2e/
├── playwright.config.ts
├── fixtures/
│   └── auth.ts           # Auth fixtures
├── pages/
│   ├── auth.page.ts      # Page objects
│   ├── dashboard.page.ts
│   └── squad.page.ts
└── tests/
    ├── auth.spec.ts
    ├── content.spec.ts
    ├── sponsor.spec.ts
    └── squad.spec.ts
```

**Acceptance Criteria**:
- All critical paths tested
- Tests run in CI before deploy
- Test failures block deployment

---

### 4.2 Visual Regression Tests
**Tasks**:
- [ ] Configure Playwright for screenshots
- [ ] Capture baseline screenshots for key pages
- [ ] Set up comparison on PR
- [ ] Review visual diffs in CI

**Acceptance Criteria**:
- Visual changes caught before merge
- Baseline updated intentionally

---

### 4.3 Load Testing
**Tasks**:
- [ ] Set up k6 or Artillery
- [ ] Define load test scenarios:
  - [ ] 100 concurrent users
  - [ ] AI generation under load
  - [ ] Database query performance
- [ ] Run load tests against staging
- [ ] Document performance baselines

**Acceptance Criteria**:
- Performance baselines documented
- No degradation under expected load

---

### 4.4 Accessibility Audit
**Tasks**:
- [ ] Run axe-core audit
- [ ] Fix critical accessibility issues:
  - [ ] Color contrast
  - [ ] Keyboard navigation
  - [ ] ARIA labels
  - [ ] Focus management
- [ ] Test with screen reader
- [ ] Document accessibility status

**Acceptance Criteria**:
- WCAG 2.1 AA compliant
- Keyboard navigation works
- Screen reader compatible

---

## Phase 5: UX Polish & Performance 🟡

**Goal**: Optimize user experience

### 5.1 Mobile Responsiveness
**Files**: Various components

**Tasks**:
- [ ] Audit all views on mobile (375px, 414px)
- [ ] Fix overflow issues
- [ ] Improve touch targets (min 44px)
- [ ] Test BottomNav on all devices
- [ ] Optimize modals for mobile
- [ ] Test landscape orientation

**Priority Views**:
1. Dashboard
2. Content Hub
3. Squad View
4. Sponsor Nexus
5. Settings

**Acceptance Criteria**:
- No horizontal scroll on mobile
- All features accessible on mobile
- Touch targets appropriately sized

---

### 5.2 Performance Optimization
**Tasks**:
- [ ] Analyze bundle with `vite-bundle-analyzer`
- [ ] Implement code splitting for routes
- [ ] Lazy load heavy components:
  - [ ] TacticsBoard
  - [ ] RadarChart
  - [ ] PDF generation
- [ ] Optimize images (WebP, lazy loading)
- [ ] Add loading skeletons
- [ ] Implement virtual scrolling for long lists

**Implementation**:
```typescript
// Lazy loading example
const TacticsBoard = lazy(() => import('./components/TacticsBoard'));
const SponsorNexus = lazy(() => import('./components/SponsorNexus'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <TacticsBoard players={players} />
</Suspense>
```

**Targets**:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Bundle size: < 500KB gzipped

**Acceptance Criteria**:
- Lighthouse performance score > 80
- No layout shift on load
- Fast perceived performance

---

### 5.3 Custom SMTP Configuration
**Tasks**:
- [ ] Set up email service (Resend, SendGrid, or Postmark)
- [ ] Configure custom domain for emails
- [ ] Update Supabase auth email templates
- [ ] Test all email types:
  - [ ] Signup verification
  - [ ] Password reset
  - [ ] Magic link
- [ ] Configure SPF/DKIM/DMARC

**Acceptance Criteria**:
- Emails sent from custom domain
- High deliverability rate
- Professional email templates

---

### 5.4 OAuth Provider Setup (Outlook)
**Tasks**:
- [ ] Register app in Azure Portal
- [ ] Configure OAuth redirect URIs
- [ ] Add client ID/secret to Supabase secrets
- [ ] Test full OAuth flow
- [ ] Handle token refresh

**Acceptance Criteria**:
- Outlook connection works end-to-end
- Token refresh works automatically
- Clear error messages for failures

---

### 5.5 Data Export Feature
**Files**: New `services/exportService.ts`, `components/SettingsView.tsx`

**Tasks**:
- [ ] Create export service
- [ ] Implement data export formats:
  - [ ] JSON (full data)
  - [ ] CSV (tabular data)
- [ ] Add export UI in Settings
- [ ] Handle large exports with streaming
- [ ] Add GDPR-compliant data request

**Acceptance Criteria**:
- Users can export their data
- Export includes all user-generated content
- Large exports don't timeout

---

## Phase 6: Future Enhancements 🟢

**Goal**: Add nice-to-have features (post-launch)

### 6.1 Scheduled Content Generation
- Pre-schedule content campaigns
- Calendar view for content planning
- Automated publication queue

### 6.2 Automated Email Sync
- Polling-based email sync
- Real-time email notifications
- Smart categorization improvements

### 6.3 Advanced Analytics Dashboard
- Historical performance charts
- Content engagement metrics
- Sponsor ROI trends over time

### 6.4 Two-Factor Authentication
- TOTP-based 2FA
- Recovery codes
- Optional per-org enforcement

### 6.5 SSO/SAML Integration
- Enterprise SSO support
- SAML 2.0 integration
- Okta/Azure AD compatibility

### 6.6 Multi-language Support (i18n)
- Extract all strings
- Translation management
- RTL language support

### 6.7 Mobile App (React Native)
- Native iOS/Android apps
- Push notifications
- Offline support

### 6.8 White-label/Custom Branding
- Custom logo upload
- Color theme customization
- Custom domain support

---

## Implementation Timeline

```
Phase 1: Security Hardening
├── Week 1-2: CORS, Rate Limiting, Password Policy
└── Week 2-3: Input Sanitization, Email Verification, Headers

Phase 2: Stability & Bug Fixes
├── Week 3: UUID Fixes, Content Schedule Button
└── Week 3-4: Color Cleanup, Error Boundaries

Phase 3: Monitoring & Observability
├── Week 4: Sentry Integration
└── Week 4-5: Analytics, Uptime Monitoring

Phase 4: Testing & Quality
├── Week 5-6: E2E Tests Setup
└── Week 6-7: Visual Regression, Load Testing, A11y

Phase 5: UX Polish & Performance
├── Week 7-8: Mobile, Performance, SMTP
└── Week 8-9: OAuth, Export Features

Phase 6: Future Enhancements
└── Ongoing: Post-launch improvements
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Security vulnerabilities | 0 critical/high |
| Test coverage | > 80% |
| Lighthouse performance | > 80 |
| Uptime | > 99.9% |
| Error rate | < 0.1% |
| Page load time | < 3s |
| Mobile usability | 100% features accessible |

---

## Resources Required

### Tools & Services
- Sentry (error monitoring) - Free tier available
- Plausible (analytics) - €9/month
- UptimeRobot (uptime) - Free tier available
- Playwright (E2E testing) - Free
- Resend (email) - Free tier available

### Environment Variables to Add
```env
# Error Monitoring
VITE_SENTRY_DSN=

# Analytics
VITE_PLAUSIBLE_DOMAIN=

# Email Service
RESEND_API_KEY=

# Outlook OAuth
OUTLOOK_CLIENT_ID=
OUTLOOK_CLIENT_SECRET=
```

---

## Definition of Done

A phase is complete when:
1. All tasks checked off
2. Acceptance criteria met
3. Code reviewed and merged
4. Documentation updated
5. Deployed to production
6. Verified working in production

---

*This plan will be updated as work progresses.*

**Created**: January 2026
**Author**: Claude
**Branch**: `claude/analyze-codebase-checklist-DsfI5`
