# PitchSide AI - QA Strategy & Test Plan

## Overview

This document outlines the quality assurance strategy for PitchSide AI, including test coverage, test types, and acceptance criteria.

---

## Test Stack

| Tool | Purpose |
|------|---------|
| Vitest | Test runner |
| @testing-library/react | React component testing |
| jest-dom | DOM assertions |
| MSW (future) | API mocking |

---

## Test Coverage Summary

| Category | Tests | Status |
|----------|-------|--------|
| Unit Tests | 88 | Passing |
| Integration Tests | 12 | Passing |
| E2E Tests | 0 | Planned |
| RLS Tests | 8 | Passing |

---

## Test Categories

### 1. Unit Tests

**Services Layer**
```typescript
describe('playerService', () => {
  it('should fetch players for a club', async () => {
    const players = await getPlayers('club-123');
    expect(players).toBeArray();
    expect(players[0]).toHaveProperty('name');
  });

  it('should fall back to demo data when Supabase unavailable', async () => {
    const players = await getPlayers('demo-club');
    expect(players.length).toBeGreaterThan(0);
  });
});
```

**Utility Functions**
```typescript
describe('errorHandler', () => {
  it('should extract message from Error object', () => {
    const result = handleError(new Error('Test error'));
    expect(result).toBe('Test error');
  });

  it('should handle Supabase error format', () => {
    const result = handleError({ message: 'DB error', code: 'PGRST' });
    expect(result).toBe('DB error');
  });
});
```

### 2. Integration Tests

**Multi-Service Workflows**
```typescript
describe('Content Generation Workflow', () => {
  it('should generate content for a fixture', async () => {
    // 1. Create fixture
    const fixture = await createFixture(clubId, fixtureData);

    // 2. Generate content
    const content = await generateContent(club, fixture, 'PREVIEW');

    // 3. Verify content created
    const items = await getContentItems(clubId);
    expect(items.some(i => i.fixture_id === fixture.id)).toBe(true);
  });
});
```

### 3. RLS Isolation Tests

**Multi-Tenant Security**
```typescript
describe('RLS Policies', () => {
  it('should prevent cross-org data access', async () => {
    // Login as Org A user
    await loginAs('user-org-a@test.com');

    // Try to fetch Org B players
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('club_id', 'org-b-club-id');

    // Should return empty (RLS blocks)
    expect(data).toHaveLength(0);
  });

  it('should allow same-org data access', async () => {
    await loginAs('user-org-a@test.com');

    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('club_id', 'org-a-club-id');

    expect(data.length).toBeGreaterThan(0);
  });
});
```

### 4. Component Tests

**UI Components**
```typescript
describe('SquadView', () => {
  it('should render player list', () => {
    render(<SquadView club={mockClub} />);

    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Midfielder')).toBeInTheDocument();
  });

  it('should open player modal on click', async () => {
    render(<SquadView club={mockClub} />);

    await userEvent.click(screen.getByText('John Smith'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

---

## Manual Test Checklist

### Authentication Flow

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Sign Up | 1. Enter email/password 2. Submit | Account created, verification email sent | ⬜ |
| Sign In | 1. Enter valid credentials 2. Submit | Dashboard loads | ⬜ |
| Sign Out | 1. Click logout | Returns to auth screen | ⬜ |
| Password Reset | 1. Click forgot password 2. Enter email | Reset email sent | ⬜ |
| Session Persistence | 1. Sign in 2. Close browser 3. Reopen | Still signed in | ⬜ |

### Content Generation

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Generate Preview | 1. Select fixture 2. Click "Generate Preview" | AI content appears in draft | ⬜ |
| Generate Report | 1. Complete fixture 2. Click "Generate Report" | Match report generated | ⬜ |
| Generate Image | 1. Click image gen 2. Select style 3. Generate | Image displayed | ⬜ |
| Approve Content | 1. View draft 2. Click approve | Status changes to APPROVED | ⬜ |
| Publish Content | 1. Approve content 2. Click publish | Status changes to PUBLISHED | ⬜ |

### Squad Management

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Add Player | 1. Click "Add Player" 2. Fill form 3. Save | Player appears in list | ⬜ |
| Edit Player | 1. Click player 2. Edit details 3. Save | Changes persisted | ⬜ |
| Delete Player | 1. Click delete 2. Confirm | Player removed, confirmation shown | ⬜ |
| View Stats | 1. Click player | Radar chart displays | ⬜ |

### Fixture Management

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Schedule Fixture | 1. Click "Schedule" 2. Fill form 3. Save | Fixture in list | ⬜ |
| Enter Result | 1. Click fixture 2. Enter score 3. Save | Status → COMPLETED | ⬜ |
| Delete Fixture | 1. Click delete 2. Confirm | Fixture removed | ⬜ |

### Sponsor Management

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Add Sponsor | 1. Click "Add Sponsor" 2. Fill form 3. Save | Sponsor in list | ⬜ |
| Generate PDF | 1. Select sponsor 2. Click "Download Report" | PDF downloads | ⬜ |
| Update ROI | 1. Edit sponsor 2. Update metrics 3. Save | ROI recalculated | ⬜ |

### Operations

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Enable Template | 1. Go to Templates 2. Toggle pack on | Pack enabled, tasks appear | ⬜ |
| Complete Task | 1. Go to Dashboard 2. Check task off | Task marked done | ⬜ |
| Track Availability | 1. Go to Availability 2. Mark player | Status updated | ⬜ |

### Demo Mode

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Demo Data Loads | 1. Sign in (no Supabase) | Demo club data visible | ⬜ |
| CRUD in Demo | 1. Add player 2. Refresh | Player persists (localStorage) | ⬜ |
| Clear Demo | 1. Click "Clear Demo Data" | Returns to fresh state | ⬜ |

---

## Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| Initial Load (FCP) | < 2s | TBD |
| Time to Interactive | < 3s | TBD |
| AI Content Generation | < 10s | ~5-8s |
| Image Generation | < 30s | ~15-25s |
| Bundle Size (gzipped) | < 500KB | TBD |

---

## Accessibility Checklist

| Requirement | Status |
|-------------|--------|
| Keyboard navigation works | ⬜ |
| Focus indicators visible | ⬜ |
| Alt text on images | ⬜ |
| Color contrast (WCAG AA) | ⬜ |
| Screen reader compatible | ⬜ |
| Responsive to 320px | ⬜ |

---

## Security Testing

### OWASP Top 10 Checklist

| Vulnerability | Mitigation | Verified |
|--------------|------------|----------|
| Injection | RLS policies, parameterized queries | ⬜ |
| Broken Auth | Supabase Auth, JWT validation | ⬜ |
| Sensitive Data Exposure | Server-side API keys, HTTPS | ⬜ |
| XXE | Not applicable (JSON only) | ✅ |
| Broken Access Control | RLS, permission hooks | ⬜ |
| Security Misconfiguration | Env var checks | ⬜ |
| XSS | React escaping, no dangerouslySetInnerHTML | ✅ |
| Insecure Deserialization | JSON.parse with validation | ⬜ |
| Components with Vulnerabilities | npm audit | ⬜ |
| Logging & Monitoring | Sentry, audit events | ⬜ |

---

## Regression Test Suite

### Critical Path Tests (Run Before Every Deploy)

1. **Auth Flow**
   - Sign in → Dashboard loads
   - Sign out → Auth screen shown

2. **Data Loading**
   - Players load correctly
   - Fixtures load correctly
   - Content loads correctly

3. **AI Generation**
   - Content generates without error
   - Image generates without error

4. **CRUD Operations**
   - Create player works
   - Edit player works
   - Delete player works

5. **Multi-Tenant Isolation**
   - Cannot access other org's data

---

## Bug Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 - Critical | System down, data loss, security breach | < 4 hours |
| P1 - High | Major feature broken, no workaround | < 24 hours |
| P2 - Medium | Feature degraded, workaround exists | < 1 week |
| P3 - Low | Minor issue, cosmetic | Next sprint |

---

## Test Environment Setup

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- services/playerService.test.ts
```

---

## CI/CD Integration

### GitHub Actions (Proposed)

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run lint
```

---

## Known Issues / Technical Debt

| Issue | Severity | Notes |
|-------|----------|-------|
| TypeScript strict errors in some services | Low | Non-blocking, existing functionality works |
| Missing E2E tests | Medium | Planned for post-pilot |
| No automated visual regression | Low | Manual verification for now |

---

## Acceptance Criteria Template

```markdown
## Story: [Title]

### Given
- [Preconditions]

### When
- [Action taken]

### Then
- [ ] [Expected result 1]
- [ ] [Expected result 2]
- [ ] [Expected result 3]

### Edge Cases
- [ ] [Edge case 1]
- [ ] [Edge case 2]
```

---

*Document Version: 1.0 | Last Updated: January 2025*
