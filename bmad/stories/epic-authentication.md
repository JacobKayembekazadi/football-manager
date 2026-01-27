# Epic: Authentication & Multi-Tenancy

## Overview
User authentication, organization management, and role-based access control.

---

## Story 1: User Sign Up

### User Story
As a **new user**, I want to **create an account**, so that **I can access PitchSide AI**.

### Acceptance Criteria
- [ ] Sign up form with email and password
- [ ] Password requirements displayed (8+ chars, etc.)
- [ ] Email verification sent
- [ ] Clear error messages for invalid input
- [ ] Redirect to workspace setup after verification
- [ ] Terms of service checkbox

### Technical Notes
- Supabase Auth `signUp` method
- Email confirmation required
- Session created on verification

### QA Notes
- Test with valid/invalid emails
- Test password requirements
- Test duplicate email

---

## Story 2: User Sign In

### User Story
As a **returning user**, I want to **sign in to my account**, so that **I can access my data**.

### Acceptance Criteria
- [ ] Email and password fields
- [ ] Remember me option
- [ ] Show/hide password toggle
- [ ] Error message for invalid credentials
- [ ] Redirect to last visited page
- [ ] Session persists across browser restarts

### Technical Notes
- Supabase Auth `signInWithPassword`
- JWT stored in localStorage
- Session refresh on page load

### QA Notes
- Test valid credentials
- Test invalid credentials
- Test session persistence

---

## Story 3: Password Reset

### User Story
As a **user who forgot my password**, I want to **reset it via email**, so that **I can regain access**.

### Acceptance Criteria
- [ ] "Forgot password" link on sign in
- [ ] Enter email address
- [ ] Receive reset email within 5 minutes
- [ ] Click link opens reset form
- [ ] Enter new password
- [ ] Password updated, can sign in
- [ ] Link expires after 24 hours

### Technical Notes
- Supabase Auth `resetPasswordForEmail`
- Custom reset page for password entry
- `updateUser` to set new password

### QA Notes
- Test reset flow end-to-end
- Test expired link
- Test invalid email

---

## Story 4: Sign Out

### User Story
As a **signed-in user**, I want to **sign out**, so that **my session is ended securely**.

### Acceptance Criteria
- [ ] Sign out button in header/menu
- [ ] Confirmation (optional)
- [ ] Session cleared
- [ ] Redirect to sign in page
- [ ] Protected pages inaccessible after sign out

### Technical Notes
- Supabase Auth `signOut`
- Clear localStorage session
- Reset app state

### QA Notes
- Test sign out
- Verify session cleared
- Test accessing protected routes

---

## Story 5: Create Organization (Workspace)

### User Story
As a **new user**, I want to **create an organization**, so that **I can set up my workspace**.

### Acceptance Criteria
- [ ] Prompt after first sign in
- [ ] Enter organization name
- [ ] Generate URL-safe slug
- [ ] User becomes org owner
- [ ] Org created in database
- [ ] Redirect to club creation

### Technical Notes
- `orgs` table with owner_id
- `org_members` entry with role='owner'
- Slug unique, lowercase, hyphenated

### QA Notes
- Test org creation
- Test duplicate slug handling
- Verify owner role assigned

---

## Story 6: Select Organization

### User Story
As a **user in multiple orgs**, I want to **switch between organizations**, so that **I can access different workspaces**.

### Acceptance Criteria
- [ ] Org selector in header/sidebar
- [ ] See list of my organizations
- [ ] Click to switch
- [ ] Data reloads for selected org
- [ ] Last selected org remembered

### Technical Notes
- Query `org_members` for user's orgs
- Store selected org_id in context/localStorage
- All queries filter by org_id

### QA Notes
- Test switching orgs
- Verify data isolation
- Test with single org (no selector needed)

---

## Story 7: Invite Team Members

### User Story
As an **org admin**, I want to **invite team members**, so that **they can collaborate**.

### Acceptance Criteria
- [ ] Invite by email
- [ ] Select role (admin/editor/viewer)
- [ ] Invitation email sent
- [ ] Recipient clicks link to accept
- [ ] Account created if new user
- [ ] Added to org with assigned role

### Technical Notes
- `org_invitations` table with token
- Email via Supabase Edge Function
- Token expires after 7 days

### QA Notes
- Test invite flow
- Test expired invitation
- Test existing user invite

---

## Story 8: Manage Team Roles

### User Story
As an **org owner**, I want to **manage member roles**, so that **access is appropriate**.

### Acceptance Criteria
- [ ] View all org members
- [ ] See each member's role
- [ ] Change member role (admin → editor, etc.)
- [ ] Remove member from org
- [ ] Cannot demote self from owner
- [ ] Confirmation for removal

### Technical Notes
- `org_members.role` field
- Roles: owner | admin | editor | viewer
- Owner cannot be changed/removed (transfer ownership is separate)

### QA Notes
- Test role changes
- Test removal
- Test self-demotion block

---

## Story 9: Club-Level Permissions

### User Story
As a **club admin**, I want to **assign club-specific roles**, so that **permissions are granular**.

### Acceptance Criteria
- [ ] Define custom club roles (Coach, Media, Kit Manager, etc.)
- [ ] Assign roles to club users
- [ ] Roles have specific permissions
- [ ] Permissions checked in UI
- [ ] Permissions enforced in API

### Technical Notes
- `club_roles` table with permissions array
- `user_roles` junction table
- `usePermission` hook for UI
- Service-level permission checks

### QA Notes
- Test custom role creation
- Test permission enforcement
- Test multi-role user

---

## Story 10: Demo Mode Authentication

### User Story
As a **demo user**, I want to **explore without signing up**, so that **I can evaluate the product**.

### Acceptance Criteria
- [ ] "Try Demo" button on sign in
- [ ] Demo account created automatically
- [ ] Pre-populated demo data
- [ ] Full functionality available
- [ ] Banner indicates demo mode
- [ ] Option to create real account

### Technical Notes
- No Supabase = demo mode
- Demo data in localStorage
- MOCK_CLUB and related data

### QA Notes
- Test demo mode
- Test data persistence in demo
- Test conversion to real account

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Supabase Auth configured | Required for production |
| Email provider (Supabase) | Required for invites |
| RLS policies | Required for isolation |

---

## Metrics

| Metric | Target |
|--------|--------|
| Sign up completion | > 70% |
| Email verification rate | > 80% |
| Invitation acceptance | > 60% |

---

*Epic Version: 1.0 | Last Updated: January 2025*
