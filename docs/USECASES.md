# PitchSide AI — Use Cases

> Comprehensive enumeration of all use cases mapped to screens and workflows.

---

## Table of Contents

1. [Authentication & Workspace](#1-authentication--workspace)
2. [Onboarding & Education](#2-onboarding--education)
3. [Dashboard](#3-dashboard)
4. [Squad Management](#4-squad-management)
5. [Fixtures & Match Reporting](#5-fixtures--match-reporting)
6. [Content Pipeline](#6-content-pipeline)
7. [Sponsor Management](#7-sponsor-management)
8. [Admin Sentinel](#8-admin-sentinel)
9. [Inbox](#9-inbox)
10. [AI Assistant](#10-ai-assistant)
11. [Settings](#11-settings)

---

## 1. Authentication & Workspace

### UC-1.1: User Registration
**Actor:** New User  
**Preconditions:** None  
**Steps:**
1. Navigate to app URL
2. Click "Create Account"
3. Enter email and password
4. Submit registration form
5. System creates user in Supabase Auth

**Outcome:** User account created, redirected to workspace creation

### UC-1.2: User Login
**Actor:** Registered User  
**Preconditions:** User has account  
**Steps:**
1. Navigate to app URL
2. Enter email and password
3. Click "Sign In"
4. System validates credentials

**Outcome:** User authenticated, redirected to workspace selection

### UC-1.3: Create Organization
**Actor:** Authenticated User (no org)  
**Preconditions:** User logged in, no existing org membership  
**Steps:**
1. System shows WorkspaceGate
2. User clicks "Create Organization"
3. Enter organization name
4. Submit form
5. System creates org, adds user as owner

**Outcome:** Organization created, user is owner

### UC-1.4: Create Club
**Actor:** Org Owner/Admin  
**Preconditions:** User is org member with admin+ role  
**Steps:**
1. In WorkspaceGate, click "Create Club"
2. Enter club details (name, nickname, colors, tone)
3. Submit form
4. System creates club under current org

**Outcome:** Club created, user can select it

### UC-1.5: Switch Organization
**Actor:** Multi-org User  
**Preconditions:** User belongs to multiple orgs  
**Steps:**
1. Click workspace switcher in sidebar
2. Select different organization
3. System loads new org context

**Outcome:** App context switches to new org

### UC-1.6: Switch Club
**Actor:** Org Member  
**Preconditions:** Org has multiple clubs  
**Steps:**
1. In WorkspaceGate, view club list
2. Click on different club
3. System loads club data

**Outcome:** App context switches to new club

### UC-1.7: Logout
**Actor:** Authenticated User  
**Steps:**
1. Click profile/logout button in sidebar
2. Confirm logout
3. System clears session

**Outcome:** User logged out, redirected to login screen

---

## 2. Onboarding & Education

### UC-2.1: View Welcome Modal (First Run)
**Actor:** New User in Workspace  
**Preconditions:** User enters workspace for first time (welcome_completed = false)  
**Screen:** OnboardingManager overlay  
**Steps:**
1. User logs in and selects org/club
2. OnboardingManager checks `user_onboarding_state`
3. If `welcome_completed = false`, show Welcome Modal
4. Modal displays quick intro and options

**Outcome:** User sees welcome message with tour/skip options

### UC-2.2: Start Guided Tour
**Actor:** New User  
**Preconditions:** Welcome Modal is displayed  
**Screen:** OnboardingManager + react-joyride overlay  
**Steps:**
1. User clicks "Start Tour" in Welcome Modal
2. Modal closes, Joyride tour begins
3. Tour highlights sidebar navigation items
4. User clicks "Next" to progress through steps
5. Tour completes or user clicks "Skip"

**DB Writes:** Updates `user_onboarding_state.tour_completed = true`

**Outcome:** User has toured key UI elements

### UC-2.3: Skip Welcome/Tour
**Actor:** New User  
**Preconditions:** Welcome Modal is displayed  
**Steps:**
1. User clicks "Skip for now"
2. Modal closes
3. System marks welcome as completed

**DB Writes:** Updates `user_onboarding_state.welcome_completed = true`

**Outcome:** User can explore app without guided tour

### UC-2.4: View Education Modules
**Actor:** Any Member  
**Screen:** Education (sidebar)  
**Steps:**
1. Click "Education" in sidebar
2. View list of education modules
3. See progress bar and completion status
4. Expand a module to see steps

**Outcome:** User sees available learning content

### UC-2.5: Complete Education Module
**Actor:** Any Member  
**Screen:** Education  
**Steps:**
1. Expand a module
2. Read through steps
3. Optionally click "Jump to" links to navigate to relevant tabs
4. Click "Mark as Complete"
5. Module shows checkmark

**DB Writes:** Appends module ID to `user_onboarding_state.completed_modules[]`

**Outcome:** Module marked complete, progress bar updates

### UC-2.6: Reset Onboarding Progress
**Actor:** Any Member  
**Screen:** Education  
**Steps:**
1. Click reset button (rotate icon) in Education header
2. Confirm reset action
3. System clears progress

**DB Writes:** Resets `user_onboarding_state` fields to defaults

**Outcome:** Welcome modal will show again, modules uncompleted

---

## 3. Dashboard

### UC-2.1: View Command Center
**Actor:** Club Member  
**Preconditions:** Club selected  
**Screen:** Dashboard  
**Steps:**
1. Navigate to Dashboard (default tab)
2. View status cards (sentiment, win probability, weather)
3. See next match countdown
4. Review latest content generations

**Outcome:** User has overview of club status

### UC-2.2: Initiate Weekly Protocol
**Actor:** Editor+  
**Preconditions:** Club selected  
**Screen:** Dashboard  
**Steps:**
1. Click "Initiate Weekly Protocol" button
2. System runs AI scout analysis
3. Generates weekly content pack
4. Redirects to Content Pipeline

**DB Writes:** Creates multiple `content_items` (weekly protocol, hype pack)

### UC-2.3: View Opponent Analysis
**Actor:** Any Member  
**Screen:** Dashboard  
**Steps:**
1. Click "Opponent Intel" card
2. System generates AI opponent report
3. View analysis in modal

**DB Writes:** None (on-demand generation)

### UC-2.4: Use Quick Start Checklist
**Actor:** New Member  
**Screen:** Dashboard  
**Steps:**
1. View Quick Start checklist on dashboard
2. Click any incomplete item to navigate to that page
3. Complete the action (add player, fixture, etc.)
4. Return to dashboard to see progress updated
5. Checklist auto-hides when all items complete

**DB Reads:** Checks players, fixtures, content, connections counts

---

## 3. Squad Management

### UC-3.1: View Squad
**Actor:** Any Member  
**Screen:** Squad  
**Steps:**
1. Navigate to Squad tab
2. View player cards in grid/list
3. Filter by position
4. Search by name

### UC-3.2: Add Player
**Actor:** Editor+  
**Screen:** Squad  
**Steps:**
1. Click "Add Player" button
2. Fill player form (name, position, stats)
3. Upload photo (optional)
4. Submit form

**DB Writes:** Insert into `players`

### UC-3.3: Edit Player
**Actor:** Editor+  
**Screen:** Squad  
**Steps:**
1. Click player card
2. Click edit icon
3. Modify player details
4. Save changes

**DB Writes:** Update `players`

### UC-3.4: Generate Player Analysis
**Actor:** Any Member  
**Screen:** Squad → Player Detail  
**Steps:**
1. Click on player card
2. If no analysis, system auto-generates
3. View AI scouting report

**DB Writes:** Updates `players.analysis`

### UC-3.5: Generate Player Video
**Actor:** Editor+  
**Screen:** Squad → Player Detail  
**Steps:**
1. Click "Generate Video" on player
2. System calls Veo API
3. Video URL stored

**DB Writes:** Updates `players.video_url`

### UC-3.6: Delete Player
**Actor:** Admin+  
**Screen:** Squad  
**Steps:**
1. Click player card
2. Click delete icon
3. Confirm deletion

**DB Writes:** Delete from `players`

### UC-3.7: View Tactics Board
**Actor:** Any Member  
**Screen:** Squad  
**Steps:**
1. Click "Tactics" toggle
2. View formation visualization
3. Drag players to positions (if editor+)

---

## 4. Fixtures & Match Reporting

### UC-4.1: View Fixtures
**Actor:** Any Member  
**Screen:** Fixtures  
**Steps:**
1. Navigate to Fixtures tab
2. Toggle between "Upcoming" and "Archive"
3. View fixture cards

### UC-4.1b: Schedule New Fixture
**Actor:** Editor+  
**Screen:** Fixtures  
**Steps:**
1. Click "Schedule Fixture" button
2. Enter opponent, date/time, venue, competition
3. Click "Schedule Fixture"
4. Fixture appears in Upcoming tab

**DB Writes:** Insert into `fixtures`

### UC-4.1c: Delete Fixture
**Actor:** Editor+  
**Screen:** Fixtures  
**Steps:**
1. Hover over fixture card
2. Click "Delete Fixture"
3. Confirm deletion
4. Fixture removed from list

**DB Writes:** Delete from `fixtures`, cascade to `content_items`

### UC-4.2: Log Match Result
**Actor:** Editor+  
**Screen:** Fixtures  
**Steps:**
1. Find completed match in list
2. Click "Log Result"
3. Enter scores, scorers, MOTM, stats
4. Click "Generate Match Report"
5. AI generates report and socials
6. Review generated content
7. Confirm and save

**DB Writes:**
- Update `fixtures` (result, status → COMPLETED)
- Insert into `content_items` (match report, socials)

### UC-4.3: View Match Report
**Actor:** Any Member  
**Screen:** Fixtures (Archive)  
**Steps:**
1. Click completed fixture
2. View generated report
3. See associated content items

---

## 5. Content Pipeline

### UC-5.1: View Content Pipeline
**Actor:** Any Member  
**Screen:** Content  
**Steps:**
1. Navigate to Content tab
2. View content in Kanban columns (Draft, Review, Published)
3. Filter by type/platform

### UC-5.2: Edit Content Item
**Actor:** Editor+  
**Screen:** Content  
**Steps:**
1. Click content card
2. Open editor modal
3. Modify text
4. Save changes

**DB Writes:** Update `content_items`

### UC-5.3: Change Content Status
**Actor:** Editor+  
**Screen:** Content  
**Steps:**
1. Drag card to new column, OR
2. Click card and change status dropdown
3. If "Published", system sets `published_at`

**DB Writes:** Update `content_items.status`, `published_at`

### UC-5.4: Generate Content
**Actor:** Editor+  
**Screen:** Content  
**Steps:**
1. Click "Generate" on content type
2. AI creates content based on context
3. Content appears in Draft column

**DB Writes:** Insert into `content_items`

### UC-5.5: Delete Content
**Actor:** Editor+  
**Screen:** Content  
**Steps:**
1. Click content card to open editor
2. Click "Delete" button in footer
3. Confirm deletion
4. Content removed from pipeline

**DB Writes:** Delete from `content_items`

---

## 6. Sponsor Management

### UC-6.1: View Sponsors
**Actor:** Any Member  
**Screen:** Commercial  
**Steps:**
1. Navigate to Commercial tab
2. View sponsor cards by tier
3. See contract status

### UC-6.1b: Add New Sponsor
**Actor:** Editor+  
**Screen:** Commercial  
**Steps:**
1. Click "Add Sponsor" button
2. Enter name, sector, tier, value, contract dates
3. Click "Add Sponsor"
4. Sponsor card appears in list

**DB Writes:** Insert into `sponsors`

### UC-6.1c: Delete Sponsor
**Actor:** Editor+  
**Screen:** Commercial  
**Steps:**
1. Hover over sponsor card
2. Click trash icon
3. Confirm deletion
4. Sponsor removed from list

**DB Writes:** Delete from `sponsors`

### UC-6.2: Generate Sponsor Content
**Actor:** Editor+  
**Screen:** Commercial  
**Steps:**
1. Click sponsor card
2. Select content type (activation, thank you, etc.)
3. Click "Generate"
4. AI creates branded content
5. Review and edit

### UC-6.3: Approve & Save Sponsor Content
**Actor:** Editor+  
**Screen:** Commercial  
**Steps:**
1. After generating, click "Approve & Save"
2. Content saved to sponsor record

**DB Writes:** Update `sponsors.generated_content`

---

## 7. Admin Sentinel

### UC-7.1: View Admin Tasks
**Actor:** Any Member  
**Screen:** Admin  
**Steps:**
1. Navigate to Admin tab
2. View tasks by priority
3. See compliance dashboard

### UC-7.1b: Add New Task
**Actor:** Editor+  
**Screen:** Admin  
**Steps:**
1. Click "Add Task" button
2. Enter title, deadline, priority, category
3. Click "Create Task"
4. Task appears in list

**DB Writes:** Insert into `admin_tasks`

### UC-7.1c: Delete Task
**Actor:** Editor+  
**Screen:** Admin  
**Steps:**
1. Hover over task card
2. Click trash icon
3. Confirm deletion
4. Task removed from list

**DB Writes:** Delete from `admin_tasks`

### UC-7.2: Generate Action Plan
**Actor:** Editor+  
**Screen:** Admin  
**Steps:**
1. Click task card
2. Click "Generate Plan"
3. AI creates step-by-step action plan
4. Plan auto-saved

**DB Writes:** Update `admin_tasks.action_plan`

### UC-7.3: Draft Task Email
**Actor:** Editor+  
**Screen:** Admin  
**Steps:**
1. Click task card
2. Click "Draft Comms"
3. AI drafts professional email
4. Edit as needed
5. Click "Save"

**DB Writes:** Update `admin_tasks.email_draft`

### UC-7.4: View Intel Inbox
**Actor:** Any Member  
**Screen:** Admin  
**Steps:**
1. View emails in right panel
2. Click email to expand
3. See AI sentiment analysis

---

## 8. Inbox

### UC-8.1: Connect Email (Master)
**Actor:** Admin+  
**Screen:** Inbox  
**Steps:**
1. Navigate to Inbox tab
2. On Master Inbox tab, click "Connect Email"
3. Choose Gmail or Outlook
4. Complete OAuth flow
5. Connection saved as shared master

**DB Writes:** Insert into `email_connections` (visibility: shared, is_master: true)

### UC-8.2: Connect Email (Personal)
**Actor:** Any Member  
**Screen:** Inbox  
**Steps:**
1. Navigate to Inbox tab
2. On My Inbox tab, click "Connect Email"
3. Choose Gmail or Outlook
4. Complete OAuth flow
5. Connection saved as private

**DB Writes:** Insert into `email_connections` (visibility: private)

### UC-8.3: Sync Emails
**Actor:** Any Member with connection  
**Screen:** Inbox  
**Steps:**
1. Click "Sync Now" button
2. System calls email-sync Edge Function
3. New emails fetched from provider
4. Emails appear in list

**DB Writes:** Insert/update `inbox_emails`

### UC-8.4: View & Reply to Email
**Actor:** Any Member  
**Screen:** Inbox  
**Steps:**
1. Click email in list
2. View full body
3. See AI sentiment analysis
4. View AI-suggested replies
5. Select or write reply
6. Click "Send Reply"

**DB Writes:** Update `inbox_emails.sent_at`

### UC-8.5: Switch Inbox Tabs
**Actor:** Any Member  
**Screen:** Inbox  
**Steps:**
1. Click "Master Inbox" or "My Inbox" tab
2. View emails from respective connections

---

## 9. AI Assistant

### UC-9.1: Chat with AI
**Actor:** Any Member  
**Screen:** AI panel (sidebar)  
**Steps:**
1. Open AI assistant panel
2. Type question/request
3. AI responds with context-aware answer
4. Continue conversation

**DB Writes:** Insert into `ai_messages`

### UC-9.2: Start New Conversation
**Actor:** Any Member  
**Screen:** AI panel  
**Steps:**
1. Click "New Chat" button
2. System creates new conversation
3. Previous history preserved

**DB Writes:** Insert into `ai_conversations`

---

## 10. Settings

### UC-10.1: View AI Settings
**Actor:** Admin+  
**Screen:** Settings  
**Steps:**
1. Navigate to Settings
2. View AI configuration section
3. See current mode (Managed/BYOK)

### UC-10.2: Enable BYOK AI (Org Level)
**Actor:** Org Owner  
**Screen:** Settings  
**Steps:**
1. Toggle "Use Own API Key"
2. Enter Gemini API key
3. Save settings

**DB Writes:** Update `org_ai_settings`

### UC-10.3: Enable BYOK AI (Club Level)
**Actor:** Club Admin  
**Screen:** Settings  
**Steps:**
1. Toggle "Override Org Settings"
2. Enter club-specific API key
3. Save settings

**DB Writes:** Update `club_ai_settings`

### UC-10.4: View Email Connections
**Actor:** Any Member  
**Screen:** Settings  
**Steps:**
1. Navigate to Settings
2. View email connections section
3. See connected accounts

### UC-10.5: Disconnect Email
**Actor:** Connection Owner / Admin  
**Screen:** Settings  
**Steps:**
1. Find connection in list
2. Click "Disconnect"
3. Confirm action

**DB Writes:** Delete from `email_connections`

---

## Use Case Matrix by Role

| Use Case | Viewer | Editor | Admin | Owner |
|----------|--------|--------|-------|-------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Initiate Protocol | ❌ | ✅ | ✅ | ✅ |
| Add/Edit Players | ❌ | ✅ | ✅ | ✅ |
| Delete Players | ❌ | ❌ | ✅ | ✅ |
| Log Match Results | ❌ | ✅ | ✅ | ✅ |
| Edit Content | ❌ | ✅ | ✅ | ✅ |
| Generate AI Content | ❌ | ✅ | ✅ | ✅ |
| Connect Master Email | ❌ | ❌ | ✅ | ✅ |
| Connect Personal Email | ✅ | ✅ | ✅ | ✅ |
| Configure BYOK (Org) | ❌ | ❌ | ❌ | ✅ |
| Configure BYOK (Club) | ❌ | ❌ | ✅ | ✅ |
| Create Club | ❌ | ❌ | ✅ | ✅ |
| Manage Members | ❌ | ❌ | ✅ | ✅ |

---

## Failure Modes & Recovery

| Scenario | Error Message | Recovery |
|----------|--------------|----------|
| Supabase not configured | "Demo mode: connect Supabase to enable persistence" | Configure env vars |
| OAuth failed | "Failed to start OAuth" | Retry, check secrets |
| AI generation failed | "Failed to generate content" | Check API key, retry |
| RLS denied | "Permission denied" | User lacks role |
| Network error | "Network error, please try again" | Retry |
| Session expired | Redirect to login | Re-authenticate |

