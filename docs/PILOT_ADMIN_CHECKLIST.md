# PitchSide AI - Pilot Admin Checklist

This checklist is for administrators preparing the platform for pilot launch.

---

## Pre-Pilot Setup

### Environment Configuration

- [ ] **Supabase Project**
  - [ ] Production project created
  - [ ] RLS policies enabled on all tables
  - [ ] Daily backups configured
  - [ ] Usage alerts configured (database, storage, bandwidth)

- [ ] **API Keys**
  - [ ] `VITE_SUPABASE_URL` set in production
  - [ ] `VITE_SUPABASE_ANON_KEY` set in production
  - [ ] `GEMINI_API_KEY` set in Supabase Edge Function secrets
  - [ ] Budget alerts configured for AI API usage

- [ ] **Error Tracking (Optional but Recommended)**
  - [ ] Sentry project created
  - [ ] `VITE_SENTRY_DSN` configured
  - [ ] Error alerts configured for critical errors

### Deployment

- [ ] **Production Build**
  ```bash
  npm run build
  ```
  - [ ] Build completes without errors
  - [ ] No console errors in production build

- [ ] **Hosting**
  - [ ] Deployed to Vercel/Netlify/similar
  - [ ] Custom domain configured (if applicable)
  - [ ] SSL certificate active

---

## Pilot Account Creation

### Create 5 Pilot Organizations

For each pilot club:

1. **In Supabase Dashboard** (Auth → Users):
   - Click "Add user"
   - Enter pilot contact's email
   - Set temporary password
   - Note credentials securely

2. **Organization Setup**:
   - Pilot signs in → creates workspace → creates club
   - Or admin pre-creates org via SQL:

   ```sql
   -- Example: Create org for pilot
   INSERT INTO organizations (name, owner_id, plan)
   VALUES ('Pilot Club Name', 'user-uuid-here', 'pilot');
   ```

### Credential Tracking

| Club Name | Contact Email | Temp Password | Status |
|-----------|---------------|---------------|--------|
| Club 1    |               |               | ⬜ Pending |
| Club 2    |               |               | ⬜ Pending |
| Club 3    |               |               | ⬜ Pending |
| Club 4    |               |               | ⬜ Pending |
| Club 5    |               |               | ⬜ Pending |

---

## Monitoring Setup

### Usage Monitoring

- [ ] **Supabase Dashboard**
  - Bookmark: `https://app.supabase.com/project/_/reports`
  - Monitor: Database size, API requests, Auth events

- [ ] **AI API Usage**
  - Track: Gemini API calls per org
  - Set budget alerts in Google Cloud Console

### Daily Check (First 2 Weeks)

- [ ] Review Sentry for errors
- [ ] Check Supabase logs for failed requests
- [ ] Monitor AI generation success rate
- [ ] Collect pilot feedback

---

## Backup & Recovery

### Supabase Backup Configuration

1. Go to: Database → Backups
2. Enable: Daily automated backups
3. Retention: 7 days minimum

### Manual Backup (Before Major Changes)

```bash
# Export via Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d).sql
```

### Recovery Procedure

1. Identify scope of data loss
2. Locate appropriate backup point
3. Contact Supabase support for point-in-time recovery (paid plans)
4. Or restore from manual backup:
   ```bash
   psql $DATABASE_URL < backup_YYYYMMDD.sql
   ```

---

## Pilot Communication

### Welcome Email Template

```
Subject: Welcome to PitchSide AI Pilot Program!

Hi [Name],

Welcome to the PitchSide AI pilot program! We're excited to have [Club Name] on board.

**Your Login Credentials:**
- URL: [App URL]
- Email: [Their Email]
- Temporary Password: [Password]

**Getting Started:**
1. Sign in at the URL above
2. Change your password on first login
3. Take the guided tour to learn the platform
4. Refer to the attached Quick Start Guide

**Support:**
- Email: support@pitchside.ai
- Response time: Within 24 hours

We'd love your feedback! Please share any issues or suggestions.

Best,
The PitchSide AI Team
```

### Feedback Collection

- [ ] Create feedback form (Google Forms/Typeform)
- [ ] Schedule weekly check-in calls (first 2 weeks)
- [ ] Track feature requests in GitHub Issues

---

## Launch Checklist

### Day Before Launch

- [ ] Final production build deployed
- [ ] All pilot accounts created
- [ ] Welcome emails drafted
- [ ] Quick start guide attached

### Launch Day

- [ ] Send welcome emails to all pilots
- [ ] Monitor error tracking closely
- [ ] Be available for support questions

### Week 1

- [ ] Daily error review
- [ ] Address critical bugs within 24 hours
- [ ] Collect initial feedback
- [ ] First check-in call with each pilot

---

## Verification Checklist (Final)

Before inviting pilots, verify:

- [ ] App deploys without errors
- [ ] AI content generation works
- [ ] Image generation works
- [ ] Multi-tenant isolation verified
- [ ] PDF reports download correctly
- [ ] Error tracking capturing issues
- [ ] Mobile layout acceptable
- [ ] 5 pilot accounts created
- [ ] Welcome documentation ready
- [ ] Support process defined

---

*This checklist ensures a smooth pilot launch. Complete all items before sending welcome emails.*
